// this file was autogenerated by arri-codegen-ts
/* eslint-disable */
import { arriRequest } from "arri-client";

interface TestClientOptions {
  baseUrl?: string;
  headers?: Record<string, string>;
}

export class TestClient {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;
  posts: TestClientPostsService;
  videos: TestClientVideosService;

  constructor(options: TestClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? "";
    this.headers = options.headers ?? {};
    this.posts = new TestClientPostsService(options);
    this.videos = new TestClientVideosService(options);
  }
}

export class TestClientPostsService {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;

  constructor(options: TestClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? "";
    this.headers = options.headers ?? {};
  }
  getPost(params: PostParams) {
    return arriRequest<Post, PostParams>({
      url: `${this.baseUrl}/rpcs/posts/get-post`,
      method: "get",
      headers: this.headers,
      params,
      parser: $$Post.parse,
      serializer: $$PostParams.serialize,
    });
  }
  getPosts(params: PostListParams) {
    return arriRequest<PostListResponse, PostListParams>({
      url: `${this.baseUrl}/rpcs/posts/get-posts`,
      method: "get",
      headers: this.headers,
      params,
      parser: $$PostListResponse.parse,
      serializer: $$PostListParams.serialize,
    });
  }
  updatePost(params: UpdatePostParams) {
    return arriRequest<Post, UpdatePostParams>({
      url: `${this.baseUrl}/rpcs/posts/update-post`,
      method: "post",
      headers: this.headers,
      params,
      parser: $$Post.parse,
      serializer: $$UpdatePostParams.serialize,
    });
  }
}

export class TestClientVideosService {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;

  constructor(options: TestClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? "";
    this.headers = options.headers ?? {};
  }
  getAnnotation(params: AnnotationId) {
    return arriRequest<Annotation, AnnotationId>({
      url: `${this.baseUrl}/rpcs/videos/get-annotation`,
      method: "get",
      headers: this.headers,
      params,
      parser: $$Annotation.parse,
      serializer: $$AnnotationId.serialize,
    });
  }
  updateAnnotation(params: UpdateAnnotationParams) {
    return arriRequest<Annotation, UpdateAnnotationParams>({
      url: `${this.baseUrl}/rpcs/videos/update-annotation`,
      method: "post",
      headers: this.headers,
      params,
      parser: $$Annotation.parse,
      serializer: $$UpdateAnnotationParams.serialize,
    });
  }
}

export interface PostParams {
  postId: string;
}
export const $$PostParams = {
  parse(input: Record<any, any>): PostParams {
    return {
      postId: typeof input.postId === "string" ? input.postId : "",
    };
  },
  serialize(input: PostParams): string {
    return JSON.stringify(input);
  },
};

export interface Post {
  id: string;
  title: string;
  type: PostType;
  description: string | null;
  content: string;
  tags: Array<string>;
  authorId: string;
  author: Author;
  createdAt: Date;
  updatedAt: Date;
}
export const $$Post = {
  parse(input: Record<any, any>): Post {
    return {
      id: typeof input.id === "string" ? input.id : "",
      title: typeof input.title === "string" ? input.title : "",
      type: $$PostType.parse(input.type),
      description:
        typeof input.description === "string" ? input.description : null,
      content: typeof input.content === "string" ? input.content : "",
      tags: Array.isArray(input.tags)
        ? input.tags.map((item) => (typeof item === "string" ? item : ""))
        : [],
      authorId: typeof input.authorId === "string" ? input.authorId : "",
      author: $$Author.parse(input.author),
      createdAt:
        typeof input.createdAt === "string"
          ? new Date(input.createdAt)
          : new Date(0),
      updatedAt:
        typeof input.updatedAt === "string"
          ? new Date(input.updatedAt)
          : new Date(0),
    };
  },
  serialize(input: Post): string {
    return JSON.stringify(input);
  },
};
export type PostType = "text" | "image" | "video";
export const $$PostType = {
  parse(input: any): PostType {
    const vals = ["text", "image", "video"];
    if (typeof input !== "string" || !vals.includes(input)) {
      throw new Error(
        `Invalid input for PostType. Expected one of the following [text, image, video]. Got ${input}.`,
      );
    }
    return input as PostType;
  },
  serialize(input: PostType): string {
    return input;
  },
};
export interface Author {
  id: string;
  name: string;
  bio: string | null;
  createdAt: Date;
  updatedAt: Date;
}
export const $$Author = {
  parse(input: Record<any, any>): Author {
    return {
      id: typeof input.id === "string" ? input.id : "",
      name: typeof input.name === "string" ? input.name : "",
      bio: typeof input.bio === "string" ? input.bio : null,
      createdAt:
        typeof input.createdAt === "string"
          ? new Date(input.createdAt)
          : new Date(0),
      updatedAt:
        typeof input.updatedAt === "string"
          ? new Date(input.updatedAt)
          : new Date(0),
    };
  },
  serialize(input: Author): string {
    return JSON.stringify(input);
  },
};

export interface PostListParams {
  limit: number;
  type?: PostType;
}
export const $$PostListParams = {
  parse(input: Record<any, any>): PostListParams {
    return {
      limit: typeof input.limit === "number" ? input.limit : 0,
      type:
        typeof input.type === "string"
          ? $$PostType.parse(input.type)
          : undefined,
    };
  },
  serialize(input: PostListParams): string {
    return JSON.stringify(input);
  },
};

export interface PostListResponse {
  total: number;
  items: Array<Post>;
}
export const $$PostListResponse = {
  parse(input: Record<any, any>): PostListResponse {
    return {
      total: typeof input.total === "number" ? input.total : 0,
      items: Array.isArray(input.items)
        ? input.items.map((item) => $$Post.parse(item))
        : [],
    };
  },
  serialize(input: PostListResponse): string {
    return JSON.stringify(input);
  },
};

export interface UpdatePostParams {
  postId: string;
  data: UpdatePostParamsData;
}
export const $$UpdatePostParams = {
  parse(input: Record<any, any>): UpdatePostParams {
    return {
      postId: typeof input.postId === "string" ? input.postId : "",
      data: $$UpdatePostParamsData.parse(input.data),
    };
  },
  serialize(input: UpdatePostParams): string {
    return JSON.stringify(input);
  },
};
export interface UpdatePostParamsData {
  title?: string;
  description?: string | null;
  content?: string;
  tags?: Array<string>;
}
export const $$UpdatePostParamsData = {
  parse(input: Record<any, any>): UpdatePostParamsData {
    return {
      title: typeof input.title === "string" ? input.title : undefined,
      description:
        typeof input.description === "string" ? input.description : undefined,
      content: typeof input.content === "string" ? input.content : undefined,
      tags: Array.isArray(input.tags)
        ? input.tags.map((item) => (typeof item === "string" ? item : ""))
        : undefined,
    };
  },
  serialize(input: UpdatePostParamsData): string {
    return JSON.stringify(input);
  },
};

export interface AnnotationId {
  id: string;
  version: string;
}
export const $$AnnotationId = {
  parse(input: Record<any, any>): AnnotationId {
    return {
      id: typeof input.id === "string" ? input.id : "",
      version: typeof input.version === "string" ? input.version : "",
    };
  },
  serialize(input: AnnotationId): string {
    return JSON.stringify(input);
  },
};

export interface Annotation {
  annotation_id: AnnotationId;
  associated_id: AssociatedId;
  annotation_type: AnnotationAnnotationType;
  annotation_type_version: number;
  metadata: any;
  box_type_range: AnnotationBoxTypeRange;
}
export const $$Annotation = {
  parse(input: Record<any, any>): Annotation {
    return {
      annotation_id: $$AnnotationId.parse(input.annotation_id),
      associated_id: $$AssociatedId.parse(input.associated_id),
      annotation_type: $$AnnotationAnnotationType.parse(input.annotation_type),
      annotation_type_version:
        typeof input.annotation_type_version === "number"
          ? input.annotation_type_version
          : 0,
      metadata: input.metadata,
      box_type_range: $$AnnotationBoxTypeRange.parse(input.box_type_range),
    };
  },
  serialize(input: Annotation): string {
    return JSON.stringify(input);
  },
};
export interface AssociatedId {
  entity_type: AnnotationAssociatedIdEntityType;
  id: string;
}
export const $$AssociatedId = {
  parse(input: Record<any, any>): AssociatedId {
    return {
      entity_type: $$AnnotationAssociatedIdEntityType.parse(input.entity_type),
      id: typeof input.id === "string" ? input.id : "",
    };
  },
  serialize(input: AssociatedId): string {
    return JSON.stringify(input);
  },
};
export type AnnotationAssociatedIdEntityType = "MOVIE_ID" | "SHOW_ID";
export const $$AnnotationAssociatedIdEntityType = {
  parse(input: any): AnnotationAssociatedIdEntityType {
    const vals = ["MOVIE_ID", "SHOW_ID"];
    if (typeof input !== "string" || !vals.includes(input)) {
      throw new Error(
        `Invalid input for AnnotationAssociatedIdEntityType. Expected one of the following [MOVIE_ID, SHOW_ID]. Got ${input}.`,
      );
    }
    return input as AnnotationAssociatedIdEntityType;
  },
  serialize(input: AnnotationAssociatedIdEntityType): string {
    return input;
  },
};
export type AnnotationAnnotationType = "ANNOTATION_BOUNDINGBOX";
export const $$AnnotationAnnotationType = {
  parse(input: any): AnnotationAnnotationType {
    const vals = ["ANNOTATION_BOUNDINGBOX"];
    if (typeof input !== "string" || !vals.includes(input)) {
      throw new Error(
        `Invalid input for AnnotationAnnotationType. Expected one of the following [ANNOTATION_BOUNDINGBOX]. Got ${input}.`,
      );
    }
    return input as AnnotationAnnotationType;
  },
  serialize(input: AnnotationAnnotationType): string {
    return input;
  },
};
export interface AnnotationBoxTypeRange {
  start_time_in_nano_sec: bigint;
  end_time_in_nano_sec: bigint;
}
export const $$AnnotationBoxTypeRange = {
  parse(input: Record<any, any>): AnnotationBoxTypeRange {
    return {
      start_time_in_nano_sec:
        typeof input.start_time_in_nano_sec === "string"
          ? BigInt(input.start_time_in_nano_sec)
          : BigInt("0"),
      end_time_in_nano_sec:
        typeof input.end_time_in_nano_sec === "string"
          ? BigInt(input.end_time_in_nano_sec)
          : BigInt("0"),
    };
  },
  serialize(input: AnnotationBoxTypeRange): string {
    return JSON.stringify(input);
  },
};

export interface UpdateAnnotationParams {
  annotation_id: string;
  annotation_id_version: string;
  data: UpdateAnnotationData;
}
export const $$UpdateAnnotationParams = {
  parse(input: Record<any, any>): UpdateAnnotationParams {
    return {
      annotation_id:
        typeof input.annotation_id === "string" ? input.annotation_id : "",
      annotation_id_version:
        typeof input.annotation_id_version === "string"
          ? input.annotation_id_version
          : "",
      data: $$UpdateAnnotationData.parse(input.data),
    };
  },
  serialize(input: UpdateAnnotationParams): string {
    return JSON.stringify(input);
  },
};
export interface UpdateAnnotationData {
  associated_id?: AssociatedId;
  annotation_type?: UpdateAnnotationParamsDataAnnotationType;
  annotation_type_version?: number;
  metadata?: any;
  box_type_range?: UpdateAnnotationParamsDataBoxTypeRange;
}
export const $$UpdateAnnotationData = {
  parse(input: Record<any, any>): UpdateAnnotationData {
    return {
      associated_id:
        typeof input.associated_id === "object" && input.associated_id !== null
          ? $$AssociatedId.parse(input.associated_id)
          : undefined,
      annotation_type:
        typeof input.annotation_type === "string"
          ? $$UpdateAnnotationParamsDataAnnotationType.parse(
              input.annotation_type,
            )
          : undefined,
      annotation_type_version:
        typeof input.annotation_type_version === "number"
          ? input.annotation_type_version
          : undefined,
      metadata: input.metadata,
      box_type_range:
        typeof input.box_type_range === "object" &&
        input.box_type_range !== null
          ? $$UpdateAnnotationParamsDataBoxTypeRange.parse(input.box_type_range)
          : undefined,
    };
  },
  serialize(input: UpdateAnnotationData): string {
    return JSON.stringify(input);
  },
};
export type UpdateAnnotationParamsDataAnnotationType = "ANNOTATION_BOUNDINGBOX";
export const $$UpdateAnnotationParamsDataAnnotationType = {
  parse(input: any): UpdateAnnotationParamsDataAnnotationType {
    const vals = ["ANNOTATION_BOUNDINGBOX"];
    if (typeof input !== "string" || !vals.includes(input)) {
      throw new Error(
        `Invalid input for UpdateAnnotationParamsDataAnnotationType. Expected one of the following [ANNOTATION_BOUNDINGBOX]. Got ${input}.`,
      );
    }
    return input as UpdateAnnotationParamsDataAnnotationType;
  },
  serialize(input: UpdateAnnotationParamsDataAnnotationType): string {
    return input;
  },
};
export interface UpdateAnnotationParamsDataBoxTypeRange {
  start_time_in_nano_sec: bigint;
  end_time_in_nano_sec: bigint;
}
export const $$UpdateAnnotationParamsDataBoxTypeRange = {
  parse(input: Record<any, any>): UpdateAnnotationParamsDataBoxTypeRange {
    return {
      start_time_in_nano_sec:
        typeof input.start_time_in_nano_sec === "string"
          ? BigInt(input.start_time_in_nano_sec)
          : BigInt("0"),
      end_time_in_nano_sec:
        typeof input.end_time_in_nano_sec === "string"
          ? BigInt(input.end_time_in_nano_sec)
          : BigInt("0"),
    };
  },
  serialize(input: UpdateAnnotationParamsDataBoxTypeRange): string {
    return JSON.stringify(input);
  },
};
