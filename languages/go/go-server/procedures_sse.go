package arri

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"reflect"
	"strings"
	"time"

	"github.com/iancoleman/strcase"
	"github.com/modiimedia/arri/languages/go/go-server/utils"
)

type SseController[T any] interface {
	Push(T) RpcError
	Close(notifyClient bool)
	Done() <-chan struct{}
	SetPingInterval(time.Duration) // How often to send a "ping" event. Default is 10 seconds.
}

type defaultSseController[T any] struct {
	responseController *http.ResponseController
	writer             http.ResponseWriter
	request            *http.Request
	headersSent        bool
	keyCasing          KeyCasing
	cancelFunc         context.CancelFunc
	context            context.Context
	pingTicker         *time.Ticker
	pingDuration       time.Duration
}

func newDefaultSseController[T any](w http.ResponseWriter, r *http.Request, keyCasing KeyCasing) *defaultSseController[T] {
	rc := http.NewResponseController(w)
	ctx, cancelFunc := context.WithCancel(r.Context())
	controller := defaultSseController[T]{
		responseController: rc,
		writer:             w,
		request:            r,
		keyCasing:          keyCasing,
		cancelFunc:         cancelFunc,
		context:            ctx,
		pingDuration:       time.Second * 10,
	}
	return &controller
}

func isHttp2(r *http.Request) bool {
	return len(r.Header.Get(":path")) > 0 || len(r.Header.Get(":method")) > 0
}

func (controller *defaultSseController[T]) startStream() {
	controller.writer.Header().Set("Content-Type", "text/event-stream")
	controller.writer.Header().Set("Cache-Control", "private, no-cache, no-store, no-transform, must-revalidate, max-age=0")

	// prevent nginx from buffering the response
	controller.writer.Header().Set("x-accel-buffering", "no")

	if !isHttp2(controller.request) {
		controller.writer.Header().Set("Connection", "keep-alive")
		controller.writer.Header().Set("Transfer-Encoding", "chunked")
	}

	controller.writer.WriteHeader(200)
	controller.responseController.EnableFullDuplex()
	controller.responseController.Flush()
	controller.headersSent = true
	controller.pingTicker = time.NewTicker(controller.pingDuration)
	go func() {
		defer controller.pingTicker.Stop()
		for {
			select {
			case <-controller.pingTicker.C:
				fmt.Fprintf(controller.writer, "event: ping\ndata:\n\n")
				controller.responseController.Flush()
			case <-controller.Done():
				return
			}
		}
	}()
}

func (controller *defaultSseController[T]) Push(message T) RpcError {
	if !controller.headersSent {
		controller.startStream()
	}
	body, bodyErr := EncodeJSON(message, EncodingOptions{KeyCasing: controller.keyCasing})
	if bodyErr != nil {
		return Error(500, bodyErr.Error())
	}
	fmt.Fprintf(controller.writer, "event: message\ndata: %s\n\n", string(body))
	controller.responseController.Flush()
	return nil
}

func (controller *defaultSseController[T]) Close(notifyClient bool) {
	if !controller.headersSent {
		controller.startStream()
	}
	if notifyClient {
		fmt.Fprint(controller.writer, "event: done\ndata: done\n\n")
		controller.responseController.Flush()
	}
	controller.cancelFunc()
}

func (controller *defaultSseController[T]) Done() <-chan struct{} {
	return controller.context.Done()
}

func (controller *defaultSseController[T]) SetPingInterval(duration time.Duration) {
	controller.pingDuration = duration
}

func eventStreamRpc[TParams, TResponse any, TEvent Event](app *App[TEvent], serviceName string, options RpcOptions, handler func(TParams, SseController[TResponse], TEvent) RpcError) {
	handlerType := reflect.TypeOf(handler)
	rpcSchema, rpcError := ToRpcDef(
		handler,
		ArriHttpRpcOptions{
			IsEventStream: true,
			IsDeprecated:  options.IsDeprecated,
			Description:   options.Description,
			Method:        options.Method,
		},
	)
	rpcName := rpcNameFromFunctionName(GetFunctionName(handler))
	encodingOpts := EncodingOptions{
		KeyCasing: app.options.KeyCasing,
		MaxDepth:  app.options.MaxDepth,
	}
	if len(serviceName) > 0 {
		rpcName = serviceName + "." + rpcName
	}
	if rpcError != nil {
		panic(rpcError)
	}
	if len(serviceName) > 0 {
		rpcSchema.Http.Path = app.options.RpcRoutePrefix + "/" + strcase.ToKebab(serviceName) + rpcSchema.Http.Path
	} else {
		rpcSchema.Http.Path = app.options.RpcRoutePrefix + rpcSchema.Http.Path
	}
	if len(options.Path) > 0 {
		rpcSchema.Http.Path = app.options.RpcRoutePrefix + options.Path
	}
	params := handlerType.In(0)
	if params.Kind() != reflect.Struct {
		panic("rpc params must be a struct. pointers and other types are not allowed.")
	}
	paramName := getModelName(rpcName, params.Name(), "Params")
	hasParams := !utils.IsEmptyMessage(params)
	if hasParams {
		paramsDefContext := newTypeDefContext(encodingOpts)
		paramsSchema, paramsSchemaErr := typeToTypeDef(params, paramsDefContext)
		if paramsSchemaErr != nil {
			panic(paramsSchemaErr)
		}
		if paramsSchema.Metadata.IsNone() {
			panic("Procedures cannot accept anonymous structs")
		}
		rpcSchema.Http.Params.Set(paramName)
		app.definitions.Set(paramName, *paramsSchema)
	} else {
		rpcSchema.Http.Params.Unset()
	}
	response := reflect.TypeFor[TResponse]()
	if response.Kind() == reflect.Ptr {
		response = response.Elem()
	}
	responseName := getModelName(rpcName, response.Name(), "Response")
	hasResponse := !utils.IsEmptyMessage(response)
	if hasResponse {
		responseDefContext := newTypeDefContext(encodingOpts)
		responseSchema, responseSchemaErr := typeToTypeDef(response, responseDefContext)
		if responseSchemaErr != nil {
			panic(responseSchemaErr)
		}
		if responseSchema.Metadata.IsNone() {
			panic("Procedures cannot return anonymous structs")
		}
		rpcSchema.Http.Response.Set(responseName)
		app.definitions.Set(responseName, *responseSchema)
	} else {
		rpcSchema.Http.Response.Unset()
	}
	app.procedures.Set(rpcName, *rpcSchema)
	onRequest, _, onAfterResponse, onError := getHooks(app)
	paramsZero := reflect.Zero(reflect.TypeFor[TParams]())
	app.Mux.HandleFunc(rpcSchema.Http.Path, func(w http.ResponseWriter, r *http.Request) {
		event, err := app.createEvent(w, r)
		if err != nil {
			handleError(false, w, r, nil, err, onError)
			return
		}
		if strings.ToLower(r.Method) != rpcSchema.Http.Method {
			handleError(false, w, r, event, Error(404, "Not found"), onError)
			return
		}
		err = onRequest(r, event)
		if err != nil {
			handleError(false, w, r, event, err, onError)
			return
		}

		if len(app.middleware) > 0 {
			for i := 0; i < len(app.middleware); i++ {
				fn := app.middleware[i]
				err := fn(r, *event, rpcName)
				if err != nil {
					handleError(false, w, r, event, err, onError)
					return
				}
			}
		}

		params, paramsOk := paramsZero.Interface().(TParams)
		if !paramsOk {
			handleError(false, w, r, event, Error(500, "Error initializing empty params"), onError)
			return
		}
		if hasParams {
			switch rpcSchema.Http.Method {
			case HttpMethodGet:
				urlValues := r.URL.Query()
				fromUrlQueryErr := DecodeQueryParams(urlValues, &params, encodingOpts)
				if fromUrlQueryErr != nil {
					handleError(false, w, r, event, fromUrlQueryErr, onError)
					return
				}
			default:
				b, bErr := io.ReadAll(r.Body)
				if bErr != nil {
					handleError(false, w, r, event, Error(400, bErr.Error()), onError)
					return
				}
				fromJSONErr := DecodeJSON(b, &params, encodingOpts)
				if fromJSONErr != nil {
					handleError(false, w, r, event, fromJSONErr, onError)
					return
				}
			}
		}

		sseController := newDefaultSseController[TResponse](w, r, app.options.KeyCasing)
		err = handler(params, sseController, *event)
		if err != nil {
			handleError(false, w, r, event, err, onError)
			return
		}
		err = onAfterResponse(r, event, "")
		if err != nil {
			handleError(false, w, r, event, err, onError)
		}
	})
}

func EventStreamRpc[TParams, TResponse any, TEvent Event](app *App[TEvent], handler func(TParams, SseController[TResponse], TEvent) RpcError, options RpcOptions) {
	eventStreamRpc(app, "", options, handler)
}

func ScopedEventStreamRpc[TParams, TResponse any, TEvent Event](app *App[TEvent], scope string, handler func(TParams, SseController[TResponse], TEvent) RpcError, options RpcOptions) {
	eventStreamRpc(app, scope, options, handler)
}

func getHooks[TEvent Event](app *App[TEvent]) (func(*http.Request, *TEvent) RpcError, func(*http.Request, *TEvent, any) RpcError, func(*http.Request, *TEvent, any) RpcError, func(*http.Request, *TEvent, error)) {
	onRequest := app.options.OnRequest
	if onRequest == nil {
		onRequest = func(r *http.Request, e *TEvent) RpcError {
			return nil
		}
	}
	onBeforeResponse := app.options.OnBeforeResponse
	if onBeforeResponse == nil {
		onBeforeResponse = func(r *http.Request, e *TEvent, a any) RpcError {
			return nil
		}
	}
	onAfterResponse := app.options.OnAfterResponse
	if onAfterResponse == nil {
		onAfterResponse = func(r *http.Request, e *TEvent, a any) RpcError {
			return nil
		}
	}
	onError := app.options.OnError
	if onError == nil {
		onError = func(r *http.Request, e *TEvent, err error) {}
	}
	return onRequest, onBeforeResponse, onAfterResponse, onError
}
