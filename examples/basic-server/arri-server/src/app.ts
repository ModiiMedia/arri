import { Type } from "@sinclair/typebox";
import { a } from "arri-validate";
import { Arri } from "arri";

const app = new Arri({});

app.registerRpc("test.getTest", {
    method: "get",
    params: undefined,
    response: a.object({
        message: a.string(),
    }),
    handler({ params }, event) {
        return {
            message: "testing!!!",
        };
    },
});

app.registerRoute({
    path: "/routes/:id/blah",
    method: "get",
    query: a.object({
        id: a.string(),
    }),
    body: a.object({
        hello: a.object({
            id: a.string(),
        }),
    }),
    handler({ query, params }) {
        return {
            id: query.id,
            routeId: params.id,
        };
    },
});

export default app;
