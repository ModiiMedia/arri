import { Type } from "@sinclair/typebox";
import { defineRpc } from "../../../_index";

export default defineRpc({
    method: "get",
    params: Type.Object({
        userId: Type.String(),
    }),
    response: Type.Object({
        id: Type.String(),
        username: Type.String(),
        email: Type.String(),
        createdAt: Type.Date(),
    }),
    async handler({ params }) {
        return {
            id: params.userId,
            username: "",
            email: "",
            createdAt: new Date(),
        };
    },
});
