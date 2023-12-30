import fs from "node:fs";
import {
    type RpcDefinition,
    normalizeWhitespace,
    type ServiceDefinition,
} from "arri-codegen-utils";
import { TestAppDefinition } from "arri-codegen-utils/dist/testModels";
import { a } from "arri-validate";
import path from "pathe";
import {
    kotlinClassFromSchema,
    kotlinClientFromDef,
    kotlinPropertyFromSchema,
    kotlinRpcFromDef,
    kotlinSealedClassedFromSchema,
    kotlinServiceFromDef,
} from "./index";

describe("Model Generation", () => {
    it("handles every scalar field type", () => {
        const User = a.object(
            {
                boolean: a.boolean(),
                string: a.string(),
                timestamp: a.timestamp(),
                float64: a.float64(),
                float32: a.float32(),
                int8: a.int8(),
                int16: a.int16(),
                int32: a.int32(),
                int64: a.int64(),
                uint8: a.uint8(),
                uint16: a.uint16(),
                uint32: a.uint32(),
                uint64: a.uint64(),
                enum: a.enumerator(["OPTION_A", "OPTION_B"]),
            },
            {
                id: "User",
            },
        );
        const result = kotlinClassFromSchema(User, {
            instancePath: "User",
            schemaPath: "",
            generatedTypes: [],
            modelPrefix: "",
        });
        expect(result.content).toBe(`@Serializable
data class User(
    val boolean: Boolean,
    val string: String,
    @Serializable(with = InstantAsStringSerializer::class)
    val timestamp: Instant,
    val float64: Double,
    val float32: Float,
    val int8: Byte,
    val int16: Short,
    val int32: Int,
    val int64: Long,
    val uint8: UByte,
    val uint16: UShort,
    val uint32: UInt,
    val uint64: ULong,
    val enum: UserEnum,
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as User

        if (boolean != other.boolean) return false
        if (string != other.string) return false
        if (timestamp != other.timestamp) return false
        if (float64 != other.float64) return false
        if (float32 != other.float32) return false
        if (int8 != other.int8) return false
        if (int16 != other.int16) return false
        if (int32 != other.int32) return false
        if (int64 != other.int64) return false
        if (uint8 != other.uint8) return false
        if (uint16 != other.uint16) return false
        if (uint32 != other.uint32) return false
        if (uint64 != other.uint64) return false
        if (enum != other.enum) return false

        return true
    }

    override fun hashCode(): Int {
        var result = boolean.hashCode()
        result = 31 * result + string.hashCode()
        result = 31 * result + timestamp.hashCode()
        result = 31 * result + float64.hashCode()
        result = 31 * result + float32.hashCode()
        result = 31 * result + int8.hashCode()
        result = 31 * result + int16.hashCode()
        result = 31 * result + int32.hashCode()
        result = 31 * result + int64.hashCode()
        result = 31 * result + uint8.hashCode()
        result = 31 * result + uint16.hashCode()
        result = 31 * result + uint32.hashCode()
        result = 31 * result + uint64.hashCode()
        result = 31 * result + enum.hashCode()
        return result
    }
}

enum class UserEnum() {
    @SerialName("OPTION_A")
    OptionA,
    @SerialName("OPTION_B")
    OptionB,
}`);
    });
    it("handles nullable and optional types", () => {
        const Schema = a.object({
            message: a.nullable(a.string()),
            messageId: a.optional(a.string()),
        });
        const result = kotlinClassFromSchema(Schema, {
            generatedTypes: [],
            instancePath: "Schema",
            schemaPath: "",
            modelPrefix: "",
        });
        expect(result.content).toBe(`@Serializable
data class Schema(
    val message: String?,
    val messageId: String? = null,
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as Schema

        if (message != other.message) return false
        if (messageId != other.messageId) return false

        return true
    }

    override fun hashCode(): Int {
        var result = (message?.hashCode() ?: 0)
        return result
    }
}

`);
    });

    it("handle arrays and nested arrays", () => {
        const Schema = a.object({
            messages: a.array(a.string()),
            favoriteMessages: a.nullable(a.array(a.string())),
            users: a.array(
                a.object(
                    {
                        id: a.string(),
                        email: a.nullable(a.string()),
                    },
                    { id: "User" },
                ),
            ),
            positions: a.array(a.array(a.number())),
        });

        const result = kotlinClassFromSchema(Schema, {
            generatedTypes: ["User"],
            instancePath: "Schema",
            schemaPath: "",
            modelPrefix: "",
        });
        expect(normalizeWhitespace(result.content ?? "")).toBe(
            normalizeWhitespace(`@Serializable
data class Schema(
    val messages: Array<String>,
    val favoriteMessages: Array<String>?,
    val users: Array<User>,
    val positions: Array<Array<Double>>,
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false
        
        other as Schema

        if (!messages.contentEquals(other.messages)) return false
        if (favoriteMessages?.contentEquals(other.favoriteMessages) != true) return false
        if (!users.contentEquals(other.users)) return false
        if (!positions.contentEquals(other.positions)) return false

        return true
    }

    override fun hashCode(): Int {
        var result = messages.contentHashCode()
        result = 31 * result + (favoriteMessages?.contentHashCode() ?: 0)
        result = 31 * result + users.contentHashCode()
        result = 31 * result + positions.contentHashCode()
        return result
    }
}

`),
        );
    });

    it("handles discriminated unions", () => {
        const Message = a.discriminator(
            "type",
            {
                TEXT: a.object({
                    id: a.string(),
                    userId: a.string(),
                    content: a.string(),
                }),
                IMAGE: a.object({
                    id: a.string(),
                    userId: a.string(),
                    imageUrl: a.string(),
                }),
            },
            { id: "Message" },
        );
        const result = kotlinSealedClassedFromSchema(Message, {
            generatedTypes: [],
            instancePath: "message",
            schemaPath: "",
            modelPrefix: "",
        });
        expect(normalizeWhitespace(result.content ?? "")).toBe(
            normalizeWhitespace(`@Serializable
sealed class Message()

@Serializable
@SerialName("TEXT")
data class MessageText(
    val id: String,
    val userId: String,
    val content: String,
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as MessageText

        if (id != other.id) return false
        if (userId != other.userId) return false
        if (content != other.content) return false

        return true
    }

    override fun hashCode(): Int {
        var result = id.hashCode()
        result = 31 * result + userId.hashCode()
        result = 31 * result + content.hashCode()
        return result
    }
}

@Serializable
@SerialName("IMAGE")
data class MessageImage(
    val id: String,
    val userId: String,
    val imageUrl: String,
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false
        
        other as MessageImage

        if (id != other.id) return false
        if (userId != other.userId) return false
        if (imageUrl != other.imageUrl) return false

        return true
    }

    override fun hashCode(): Int {
        var result = id.hashCode()
        result = 31 * result + userId.hashCode()
        result = 31 * result + imageUrl.hashCode()
        return result
    }
}`),
        );
    });

    it("handles records", () => {
        const Schema = a.object({
            postIds: a.record(a.string()),
            users: a.record(
                a.object(
                    {
                        id: a.string(),
                        email: a.nullable(a.string()),
                    },
                    {
                        id: "User",
                    },
                ),
            ),
        });
        const result = kotlinPropertyFromSchema(Schema, {
            generatedTypes: ["User"],
            instancePath: "Schema",
            schemaPath: "",
            modelPrefix: "",
        });
        expect(normalizeWhitespace(result.content ?? "")).toBe(
            normalizeWhitespace(`@Serializable
data class Schema(
    val postIds: Map<String, String>,
    val users: Map<String, User>,
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false
        
        other as Schema

        if (postIds != other.postIds) return false
        if (users != other.users) return false

        return true
    }

    override fun hashCode(): Int {
        var result = postIds.hashCode()
        result = 31 * result + users.hashCode()
        return result
    }
}`),
        );
    });
});

describe("procedures", () => {
    it("handles standard procedures", () => {
        const input: RpcDefinition = {
            method: "post",
            path: "/say-hello",
            params: "SayHelloParams",
            response: "SayHelloResponse",
        };
        const result = kotlinRpcFromDef("sayHello", input, {
            clientName: "Client",
        });
        expect(normalizeWhitespace(result)).toBe(
            normalizeWhitespace(`suspend fun sayHello(params: SayHelloParams): SayHelloResponse {
            val response = prepareRequest(
                client = httpClient,
                url = "$baseUrl/say-hello",
                method = HttpMethod.Post,
                params = JsonInstance.encodeToJsonElement<SayHelloParams>(params),
                headers = headers,
            ).execute()
            return JsonInstance.decodeFromString<SayHelloResponse>(response.body())
        }`),
        );
    });
    it("handles standard procedures with undefined params", () => {
        const input: RpcDefinition = {
            method: "get",
            path: "/get-status",
            params: undefined,
            response: "Status",
        };
        const result = kotlinRpcFromDef("getStatus", input, {
            clientName: "Client",
        });
        expect(normalizeWhitespace(result)).toBe(
            normalizeWhitespace(`suspend fun getStatus(): Status {
            val response = prepareRequest(
                client = httpClient,
                url = "$baseUrl/get-status",
                method = HttpMethod.Get,
                params = null,
                headers = headers,
            ).execute()
            return JsonInstance.decodeFromString<Status>(response.body())
        }`),
        );
    });
    it("handles standard procedures with undefined response", () => {
        const input: RpcDefinition = {
            method: "put",
            path: "/create-user",
            params: "CreateUserParams",
            response: undefined,
        };
        const result = kotlinRpcFromDef("createUser", input, {
            clientName: "TestClient",
        });
        expect(normalizeWhitespace(result)).toBe(
            normalizeWhitespace(`suspend fun createUser(params: CreateUserParams): Unit {
            prepareRequest(
                client = httpClient,
                url = "$baseUrl/create-user",
                method = HttpMethod.Put,
                params = JsonInstance.encodeToJsonElement<CreateUserParams>(params),
                headers = headers,
            ).execute()
        }`),
        );
    });
    it("handles event stream procedures", () => {});
});

describe("services", () => {
    it("handles nested services", () => {
        const input: ServiceDefinition = {
            getUser: {
                method: "get",
                path: "/users/get-user",
                params: "UserParams",
                response: "User",
            },
            updateUser: {
                method: "patch",
                path: "/users/update-user",
                params: "UpdateUserParams",
                response: undefined,
            },
            watchUser: {
                method: "get",
                path: "/users/watch-user",
                params: "UserParams",
                response: "User",
                isEventStream: true,
            },
            settings: {
                getSettings: {
                    method: "get",
                    path: "/users/settings/get-settings",
                    params: "UserSettingsParams",
                    response: "UserSettings",
                },
            },
        };
        const result = kotlinServiceFromDef("Users", input, {
            clientName: "ArriClient",
        });
        expect(normalizeWhitespace(result)).toBe(
            normalizeWhitespace(`class ArriClientUsersService(
            private val httpClient: HttpClient,
            private val baseUrl: String = "",
            private val headers: Map<String, String> = mutableMapOf(),
        ) {
            val settings = ArriClientUsersSettingsService(httpClient, baseUrl, headers)

            suspend fun getUser(params: UserParams): User {
                val response = prepareRequest(
                    client = httpClient,
                    url = "$baseUrl/users/get-user",
                    method = HttpMethod.Get,
                    params = JsonInstance.encodeToJsonElement<UserParams>(params),
                    headers = headers,
                ).execute()
                return JsonInstance.decodeFromString<User>(response.body())
            }
            suspend fun updateUser(params: UpdateUserParams): Unit {
                prepareRequest(
                    client = httpClient,
                    url = "$baseUrl/users/update-user",
                    method = HttpMethod.Patch,
                    params = JsonInstance.encodeToJsonElement<UpdateUserParams>(params),
                    headers = headers,
                ).execute()
            }
            fun watchUser(
                scope: CoroutineScope,
                params: UserParams,
                lastEventId: String? = null,
                bufferCapacity: Int = 1024,
                onOpen: ((response: HttpResponse) -> Unit) = {},
                onClose: (() -> Unit) = {},
                onError: ((error: ArriClientError) -> Unit) = {},
                onConnectionError: ((error: ArriClientError) -> Unit) = {},
                onData: ((data: User) -> Unit) = {},
            ): Job {
                val finalHeaders = mutableMapOf<String, String>()
                for (item in headers.entries) {
                    finalHeaders[item.key] = item.value
                }
                finalHeaders["Accept"] = "application/json, text/event-stream"
                val job = scope.launch {
                    handleSseRequest(
                        scope = scope,
                        httpClient = httpClient,
                        url = "$baseUrl/users/watch-user",
                        method = HttpMethod.Get,
                        params = JsonInstance.encodeToJsonElement<UserParams>(params),
                        headers = finalHeaders,
                        backoffTime = 0,
                        maxBackoffTime = 32000,
                        lastEventId = lastEventId,
                        bufferCapacity = bufferCapacity,
                        onOpen = onOpen,
                        onClose = onClose,
                        onError = onError,
                        onConnectionError = onConnectionError,
                        onData = { str ->
                            val data = JsonInstance.decodeFromString<User>(str)
                            onData(data)
                        },
                    )
                }
                return job
            }
        }
        
        class ArriClientUsersSettingsService(
            private val httpClient: HttpClient,
            private val baseUrl: String = "",
            private val headers: Map<String, String> = mutableMapOf(),
        ) {
            suspend fun getSettings(params: UserSettingsParams): UserSettings {
                val response = prepareRequest(
                    client = httpClient,
                    url = "$baseUrl/users/settings/get-settings",
                    method = HttpMethod.Get,
                    params = JsonInstance.encodeToJsonElement<UserSettingsParams>(params),
                    headers = headers,
                ).execute()
                return JsonInstance.decodeFromString<UserSettings>(response.body())
            }
        }`),
        );
    });
});

describe("client", () => {
    it("it matches the reference client", () => {
        const result = kotlinClientFromDef(TestAppDefinition, {
            clientName: "TestClient",
        });
        const expectedResult = fs.readFileSync(
            path.resolve(
                __dirname,
                "../../kotlin-reference/src/main/kotlin/TestClient.kt",
            ),
            {
                encoding: "utf8",
            },
        );
        expect(result).toEqual(expectedResult);
    });
});
