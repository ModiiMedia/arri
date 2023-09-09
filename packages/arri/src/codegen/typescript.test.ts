import { writeFileSync } from "fs";
import { Type } from "@sinclair/typebox";
import {
    createTypescriptClient,
    tsModelFromDefinition,
    tsServiceFromServiceDefinition,
} from "./typescript";
import {
    type ServiceDef,
    normalizeWhitespace,
    type ApplicationDef,
} from "./utils";

describe("generateService", () => {
    test("Basic Service", () => {
        const input: ServiceDef = {
            getUser: {
                description: "Fetches the user by id",
                path: "/users/get-user",
                method: "get",
                params: undefined,
                response: undefined,
            },
            updateUser: {
                description: "Updates the user by id",
                path: "/users/update-user",
                method: "post",
                params: "User",
                response: "User",
            },
            comments: {
                getUserComments: {
                    path: "/users/comments/get-user-comments",
                    method: "get",
                    params: "UsersCommentsGetUserCommentsParams",
                    response: "UsersCommentsGetUserCommentsResponse",
                },
            },
        };
        const result = tsServiceFromServiceDefinition("UsersService", input);
        expect(normalizeWhitespace(result)).toBe(
            normalizeWhitespace(`
        export class UsersService {
            private baseUrl: string;
            private headers: Record<string, string>;
            comments: UsersCommentsService;
            constructor(opts: { baseUrl?: string; headers?: Record<string, string> }) {
                this.baseUrl = opts.baseUrl ?? "";
                this.headers = opts.headers ?? {};
                this.comments = new UsersCommentsService(opts);
            }
            async getUser() {
                return arriRequest<undefined>({
                    url: \`\${this.baseUrl}/users/get-user\`,
                    method: 'get',
                    headers: this.headers,
                });
            }
            async updateUser(params: User) {
                return arriRequest<User>({
                    url: \`\${this.baseUrl}/users/update-user\`,
                    method: 'post',
                    params,
                    headers: this.headers,
                });
            }
        }
        export class UsersCommentsService {
            private baseUrl: string;
            private headers: Record<string, string>;
            constructor(opts: { baseUrl?: string; headers?: Record<string, string> }) {
                this.baseUrl = opts.baseUrl ?? "";
                this.headers = opts.headers ?? {};
            }
            async getUserComments(params: UsersCommentsGetUserCommentsParams) {
                return arriRequest<UsersCommentsGetUserCommentsResponse>({
                    url: \`\${this.baseUrl}/users/comments/get-user-comments\`,
                    method: 'get',
                    params,
                    headers: this.headers,
                });
            }
        }`),
        );
    });
});

describe("Generate Models", () => {
    test("basicModel", () => {
        const input = Type.Object({
            id: Type.String(),
            email: Type.Optional(Type.String()),
            createdAt: Type.Date(),
            updatedAt: Type.Number(),
            avgSessionTime: Type.Integer(),
            role: Type.Enum({
                standard: "standard",
                admin: "admin",
            }),
            isPrivate: Type.Boolean(),
            recentFollows: Type.Array(Type.String()),
            preferences: Type.Object({
                darkMode: Type.Boolean(),
                colorScheme: Type.Enum({
                    red: "red",
                    blue: "blue",
                    green: "green",
                }),
            }),
            favoriteFoods: Type.Array(
                Type.Object({
                    id: Type.String(),
                    name: Type.String(),
                }),
            ),
            miscData: Type.Record(Type.String(), Type.Any()),
        });
        const result = tsModelFromDefinition("User", input as any);
        expect(normalizeWhitespace(result)).toBe(
            normalizeWhitespace(`
        export interface User {
            id: string;
            email?: string;
            createdAt: Date;
            updatedAt: number;
            /**
             * must be an integer
             */
            avgSessionTime: number;
            role: 'standard' | 'admin';
            isPrivate: boolean;
            recentFollows: string[];
            preferences: UserPreferences;
            favoriteFoods: UserFavoriteFoodsItem[];
            miscData: any;
        }
        export interface UserPreferences {
            darkMode: boolean;
            colorScheme: 'red' | 'blue' | 'green';
        }
        export interface UserFavoriteFoodsItem {
            id: string;
            name: string;
        }
        `),
        );
    });
});

test("Client generation", async () => {
    const UserSchema = Type.Object({
        id: Type.String(),
        name: Type.String(),
        email: Type.String(),
        createdAt: Type.Date(),
    });
    const input: ApplicationDef = {
        arriSchemaVersion: "0.0.1",
        procedures: {
            sayHello: {
                path: "/say-hello",
                method: "get",
                params: undefined,
                response: "SayHelloResponse",
            },
            "users.getUser": {
                path: "/users/get-user",
                method: "get",
                params: "UserParams",
                response: "User",
            },
            "users.updateUser": {
                path: "/users/update-user",
                method: "post",
                params: "UsersUpdateUserParams",
                response: "User",
            },
            "posts.getPost": {
                path: "/posts/get-post",
                method: "get",
                params: "PostParams",
                response: "Post",
            },
            "posts.comments.getComment": {
                path: "/posts/comments/get-comment",
                method: "get",
                params: "PostCommentParams",
                response: undefined,
            },
        },
        models: {
            SayHelloResponse: Type.Object({
                message: Type.String(),
            }),
            User: UserSchema as any,
            UserParams: Type.Object({
                userId: Type.String(),
            }),
            UsersUpdateUserParams: Type.Object({
                userId: Type.String(),
                data: Type.Partial(UserSchema),
            }) as any,
            PostParams: Type.Object({
                postId: Type.String(),
            }),
            Post: Type.Object({
                id: Type.String(),
                title: Type.String(),
                createdAt: Type.Integer(),
            }),
            PostCommentParams: Type.Object({
                postId: Type.String(),
                commentId: Type.String(),
            }),
        } as any,
        errors: Type.Object({}),
    };
    const client = await createTypescriptClient(input, `TypescriptClient`);
    writeFileSync("./example-client.ts", client);
});
