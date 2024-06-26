import {
    HttpRpcDefinition,
    isRpcDefinition,
    isServiceDefinition,
    RpcDefinition,
    ServiceDefinition,
    WsRpcDefinition,
} from "@arrirpc/codegen-utils";
import assert from "assert";

import {
    formatDescriptionComment,
    GeneratorContext,
    validRustIdentifier,
    validRustName,
} from "./_common";

export function rustRpcFromSchema(
    schema: RpcDefinition,
    context: GeneratorContext,
): string {
    switch (schema.transport) {
        case "http":
            return rustHttpRpcFromSchema(schema, context);
        case "ws":
            return rustWsRpcFromSchema(schema, context);
        default:
            console.warn(
                `[rust-codegen] Unknown transport type "${schema.transport}". Skipping ${context.instancePath}.`,
            );
            return "";
    }
}

export function rustHttpRpcFromSchema(
    schema: HttpRpcDefinition,
    context: GeneratorContext,
): string {
    const functionName = getFunctionName(context.instancePath);
    let leading = "";
    if (schema.description) {
        leading += formatDescriptionComment(schema.description);
        leading += "\n";
    }
    if (schema.isDeprecated) {
        leading += "#[deprecated]\n";
    }
    const params = schema.params ? validRustName(schema.params) : undefined;
    const response = schema.response
        ? validRustName(schema.response)
        : undefined;
    if (schema.isEventStream) {
        return `${leading}pub async fn ${functionName}<OnEvent>(
            self: &Self,
            ${params ? `params: ${context.typeNamePrefix}${params},` : ""}
            on_event: OnEvent,
        ) where
            OnEvent: Fn(SseEvent<${response ? `${context.typeNamePrefix}${response}` : "EmptyArriModel"}>) -> (), {
            parsed_arri_sse_request(
                ArriParsedSseRequestOptions {
                    client: &self.config.http_client,
                    url: format!("{}${schema.path}", &self.config.base_url),
                    method: reqwest::Method::${schema.method.toUpperCase()},
                    headers: self.config.headers,
                    client_version: "${context.clientVersion}".to_string(),
                },
                ${params ? `Some(params)` : "None"},
                on_event,
            )
            .await;
        }`;
    }
    return `${leading}pub async fn ${functionName}(
        self: &Self,
        ${params ? `params: ${context.typeNamePrefix}${params},` : ""}
    ) -> Result<${context.typeNamePrefix}${response ?? "()"}, ArriServerError> {
        parsed_arri_request(
            ArriParsedRequestOptions {
                http_client: &self.config.http_client,
                url: format!("{}${schema.path}", &self.config.base_url),
                method: reqwest::Method::${schema.method.toUpperCase()},
                headers: self.config.headers,
                client_version: "${context.clientVersion}".to_string(),
            },
            ${params ? `Some(params)` : "None::<EmptyArriModel>"},
            |body| ${response ? `return ${context.typeNamePrefix}${response}::from_json_string(body)` : "{}"},
        )
        .await
    }`;
}

export function rustWsRpcFromSchema(
    schema: WsRpcDefinition,
    context: GeneratorContext,
): string {
    console.warn(
        `[rust-codegen] WS RPCs are not supported at this time. Skipping ${context.instancePath}.`,
    );
    return "";
}

export function getFunctionName(instancePath: string): string {
    assert(instancePath.length > 0);
    const name = instancePath.split(".").pop() ?? "";
    return validRustIdentifier(name);
}

export function getServiceName(
    instancePath: string,
    context: GeneratorContext,
): string {
    assert(instancePath.length > 0);
    const name = instancePath.split(".").join("_");
    return validRustName(`${context.clientName}_${name}_Service`);
}

export function rustServiceFromSchema(
    schema: ServiceDefinition,
    context: GeneratorContext,
): { name: string; content: string } {
    const serviceName = getServiceName(context.instancePath, context);
    const subServices: { key: string; name: string }[] = [];
    const subServiceContent: string[] = [];
    const rpcParts: string[] = [];
    for (const key of Object.keys(schema)) {
        const subSchema = schema[key]!;
        if (isServiceDefinition(subSchema)) {
            const subService = rustServiceFromSchema(subSchema, {
                clientVersion: context.clientVersion,
                clientName: context.clientName,
                typeNamePrefix: context.typeNamePrefix,
                instancePath: `${context.instancePath}.${key}`,
                schemaPath: `${context.schemaPath}.${key}`,
                generatedTypes: context.generatedTypes,
            });
            if (subService.content) {
                subServices.push({
                    key: validRustIdentifier(key),
                    name: subService.name,
                });
            }
            continue;
        }
        if (isRpcDefinition(subSchema)) {
            const rpc = rustRpcFromSchema(subSchema, {
                clientVersion: context.clientVersion,
                clientName: context.clientName,
                typeNamePrefix: context.typeNamePrefix,
                instancePath: `${context.instancePath}.${key}`,
                schemaPath: `${context.schemaPath}.${key}`,
                generatedTypes: context.generatedTypes,
            });
            if (rpc) {
                rpcParts.push(rpc);
            }
            continue;
        }
        throw new Error(
            `[rust-codegen] Invalid schema at /procedures/${context.instancePath}.`,
        );
    }
    return {
        name: serviceName,
        content: `pub struct ${serviceName} {
    config: ArriClientConfig,
${subServices.map((service) => `    pub ${service.key}: ${service.name},`).join("\n")}
}

impl ArriClientService for ${serviceName} {
    fn create(config: ArriClientConfig) -> Self {
        Self {
            config: config${subServices.length ? ".clone()" : ""},
${subServices.map((service) => `            ${service.key}: ${service.name}::create(config.clone()),`).join("\n")}
        }
    }
}

impl ${serviceName} {
${rpcParts.join("\n")}
}

${subServiceContent.join("\n\n")}
`,
    };
}
