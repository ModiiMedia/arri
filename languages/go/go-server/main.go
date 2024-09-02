package main

import (
	"fmt"
	"log"
	"net/http"
	"time"
)

type MyCustomContext struct{}

func onRequest(r *http.Request, c MyCustomContext) *ErrorResponse {
	fmt.Println("NEW REQUEST", r.URL.Path)
	return nil
}

func main() {
	mux := http.DefaultServeMux
	options := AppOptions[MyCustomContext]{
		AppName:        "My Awesome App",
		AppVersion:     "1",
		AppDescription: "Hello",
		RpcRoutePrefix: "/procedures",
		OnRequest:      onRequest,
		OnError: func(r *http.Request, mcc *MyCustomContext, err error) {
			fmt.Println("NEW ERROR", r.URL.Path, err.Error())
		},
	}
	result, _ := ToJson(
		Shape{
			Child: &Child{
				Child: NotNull(
					Shape{Rectangle: &Rectangle{}},
				),
			},
		},
		KeyCasingCamelCase,
	)
	fmt.Println(string(result))
	app := NewApp(
		mux,
		options,
		// create the RPC context for each request
		// this is generic so users can user whatever struct they want for their context
		(func(r *http.Request) (*MyCustomContext, *ErrorResponse) {
			return &MyCustomContext{}, nil
		}),
	)
	// register an RPC
	Rpc(&app, GetUser)
	Rpc(&app, DeleteUser)
	RegisterDef(&app, Message{})
	// register an RPC with a custom HTTP method and path
	RpcWithOptions(&app, RpcOptions{
		Method: HttpMethodPatch,
		Path:   "/update-user",
	}, UpdateUser)
	log.Println("starting server at http://localhost:4040")
	log.Fatal(http.ListenAndServe(":4040", mux))
}

type UserParams struct {
	UserId string `arri:"required"`
}
type User struct {
	Id       string
	Name     Option[Nullable[string]]
	Email    string
	IsAdmin  bool
	Metadata struct {
		CreatedAt time.Time
	}
}

func DeleteUser(params UserParams, context MyCustomContext) (*User, *ErrorResponse) {
	return &User{Id: params.UserId, Name: None[Nullable[string]]()}, nil
}

func GetUser(params UserParams, context MyCustomContext) (*User, *ErrorResponse) {
	return &User{Id: params.UserId}, nil
}

func UpdateUser(params User, context MyCustomContext) (*User, *ErrorResponse) {
	return &params, nil
}
