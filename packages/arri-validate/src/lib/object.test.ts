import * as a from "./_index";

const UserSchema = a.object({
    id: a.string(),
    name: a.string(),
    email: a.nullable(a.string()),
    createdAt: a.optional(a.timestamp()),
    isAdmin: a.boolean(),
});

type UserSchema = a.infer<typeof UserSchema>;

const PostSchema = a.object({
    id: a.string(),
    title: a.string(),
    createdAt: a.timestamp(),
    userId: a.string(),
    user: UserSchema,
});

type PostSchema = a.infer<typeof PostSchema>;

describe("type inference", () => {
    it("infers types from object schema", () => {
        const SomeObject = a.object({
            id: a.string(),
            email: a.string(),
            type: a.stringEnum(["a", "b", "c"]),
            _metadata: a.object({
                createdAt: a.timestamp(),
                updatedAt: a.timestamp(),
            }),
        });

        type SomeObject = a.infer<typeof SomeObject>;
        assertType<SomeObject>({
            id: "12345",
            email: "johndoe@gmail",
            type: "b",
            _metadata: {
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        });
    });
    it("accounts for optional and null properties", () => {
        const SomeObject = a.object({
            id: a.string(),
            email: a.optional(a.string()),
            type: a.stringEnum(["a", "b", "c"]),
            _metadata: a.optional(
                a.object({
                    createdAt: a.timestamp(),
                    updatedAt: a.timestamp(),
                    lastSignedIn: a.nullable(a.timestamp()),
                }),
            ),
        });
        type SomeObject = a.infer<typeof SomeObject>;
        assertType<SomeObject>({
            id: "12345",
            type: "b",
            email: undefined,
            _metadata: undefined,
        });
        assertType<SomeObject>({
            id: "12345",
            email: "1231351",
            type: "a",
            _metadata: {
                createdAt: new Date(),
                updatedAt: new Date(),
                lastSignedIn: null,
            },
        });
    });
    it("accounts for the additional properties parameter", () => {
        const SomeObject = a.object(
            {
                id: a.string(),
                email: a.string(),
            },
            { additionalProperties: true },
        );
        type SomeObject = a.infer<typeof SomeObject>;
        assertType<SomeObject>({
            id: "12355",
            email: "johndoe@gmail.com",
        });
        assertType<SomeObject>({
            id: "12345",
            email: "johndoe@gmail.com",
            isAdmin: false,
            someOtherProp: [{ id: 1, date: new Date() }],
        });
    });
    it("accounts for extended objects", () => {
        const SomeObject = a.object({
            id: a.string(),
            email: a.string(),
        });
        const SomeOtherObject = a.object({
            name: a.string(),
            createdAt: a.timestamp(),
        });
        const CombinedObject = a.extend(SomeObject, SomeOtherObject);
        type CombinedObject = a.infer<typeof CombinedObject>;
        assertType<CombinedObject>({
            id: "13245",
            email: "johndoe@gmail.com",
            name: "John Doe",
            createdAt: new Date(),
        });
    });
});

test("Parsing", () => {
    const badInput = {
        blah: "123513",
        name: "john doe",
    };
    const badJsonInput = JSON.stringify(badInput);
    expect(a.safeParse(UserSchema, badInput).success).toBe(false);
    expect(a.safeParse(UserSchema, badJsonInput).success).toBe(false);
    const goodInput = {
        id: "12345",
        name: "john doe",
        email: null,
        createdAt: new Date(),
        isAdmin: false,
    };
    const goodJsonInput = JSON.stringify(goodInput);
    expect(a.safeParse(UserSchema, goodInput).success).toBe(true);
    expect(a.safeParse(UserSchema, goodJsonInput).success).toBe(true);
});

test("Nested Object", () => {
    const badInput = {
        id: "12345",
        title: "Some Title",
        createdAt: new Date(),
        userId: "12345",
        user: {
            id: "12345",
            name: "John Doe",
            email: null,
            createdAt: 123456,
            isAdmin: true,
        },
    };
    const badJsonInput = JSON.stringify(badInput);
    const badInputResult = a.safeParse(PostSchema, badInput);
    if (badInputResult.success) {
        console.error(badInputResult.value);
    }
    expect(badInputResult.success).toBe(false);
    expect(a.safeParse(PostSchema, badJsonInput).success).toBe(false);
    const goodInput: PostSchema = {
        id: "1234456",
        title: "Hello World",
        createdAt: new Date(),
        userId: "123456",
        user: {
            id: "123456",
            name: "John Doe",
            email: null,
            createdAt: new Date(),
            isAdmin: false,
        },
    };
    const goodJsonInput = JSON.stringify(goodInput);
    expect(a.safeParse(PostSchema, goodInput).success).toBe(true);
    expect(a.safeParse(PostSchema, goodJsonInput).success).toBe(true);
});

describe("Pick", () => {
    test("User Subset", () => {
        const UserSubsetSchema = a.pick(UserSchema, ["name", "email"]);
        type UserSubsetSchema = a.infer<typeof UserSubsetSchema>;
        assertType<UserSubsetSchema>({ name: "John Doe", email: null });
        const originalInput: UserSchema = {
            id: "123115",
            name: "John Doe",
            email: "johndoe@gmail.com",
            isAdmin: false,
            createdAt: undefined,
        };
        expect(a.safeParse(UserSubsetSchema, originalInput).success).toBe(
            false,
        );
        const subSetInput: UserSubsetSchema = {
            name: "john doe",
            email: "johndoe@gmail.com",
        };
        expect(a.safeParse(UserSubsetSchema, subSetInput).success).toBe(true);
    });
});

describe("Omit", () => {
    test("User Omission", () => {
        const UserSubsetSchema = a.omit(UserSchema, ["id", "isAdmin"]);
        type UserSubsetSchema = a.infer<typeof UserSubsetSchema>;
        assertType<UserSubsetSchema>({
            name: "john doe",
            email: null,
            createdAt: new Date(),
        });
        const originalInput: UserSchema = {
            id: "234142",
            name: "John Doe",
            isAdmin: false,
            email: null,
            createdAt: new Date(),
        };
        const result = a.safeParse(UserSubsetSchema, originalInput);
        if (result.success) {
            console.error(result);
        }
        expect(a.safeParse(UserSubsetSchema, originalInput).success).toBe(
            false,
        );
        const subsetInput: UserSubsetSchema = {
            name: "John Doe",
            email: null,
            createdAt: new Date(),
        };

        expect(a.safeParse(UserSubsetSchema, subsetInput).success).toBe(true);
    });
});
