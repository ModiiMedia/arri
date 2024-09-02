package main

import (
	"log"
	"net/http"
)

type MyCustomContext struct{}

func main() {
	mux := http.DefaultServeMux
	options := AppOptions[MyCustomContext]{
		AppName:        "My Awesome App",
		AppVersion:     "1",
		AppDescription: "Hello",
		RpcRoutePrefix: "/procedures",
	}
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
	// register an RPC with a custom HTTP method and path
	RpcWithOptions(&app, RpcOptions{
		Method: HttpMethodPatch,
		Path:   "/update-user",
	}, UpdateUser)
	log.Println("starting server at http://localhost:4040")
	log.Fatal(http.ListenAndServe(":4040", mux))
}

type UserParams struct {
	UserId string
}
type User struct {
	Id      string
	Name    string
	Email   string
	IsAdmin bool
}

func DeleteUser(params UserParams, context MyCustomContext) (*User, *ErrorResponse) {
	return &User{Id: params.UserId}, nil
}

func GetUser(params UserParams, context MyCustomContext) (*User, *ErrorResponse) {
	return &User{Id: params.UserId}, nil
}

func UpdateUser(params User, context MyCustomContext) (*User, *ErrorResponse) {
	return &params, nil
}
