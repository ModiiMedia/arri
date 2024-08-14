import { isSchemaFormRef, SchemaFormProperties } from "@arrirpc/codegen-utils";

import {
    codeComments,
    GeneratorContext,
    getTypeName,
    isNullableType,
    SwiftProperty,
    validSwiftKey,
} from "./_common";
import { swiftTypeFromSchema } from "./_index";

export function swiftObjectFromSchema(
    schema: SchemaFormProperties,
    context: GeneratorContext,
): SwiftProperty {
    const typeName = getTypeName(schema, context);
    const prefixedTypeName = `${context.typePrefix}${typeName}`;
    const isNullable = isNullableType(schema, context);
    const defaultValue = isNullable ? "" : `${prefixedTypeName}()`;
    const result: SwiftProperty = {
        typeName: isNullable ? `${prefixedTypeName}?` : prefixedTypeName,
        defaultValue,
        isNullable,
        canBeQueryString: false,
        fromJsonTemplate(input, target) {
            if (context.isOptional) {
                return `if ${input}.exists() {
                    ${target} = ${prefixedTypeName}(json: ${input})
                }`;
            }
            if (schema.nullable) {
                return `if ${input}.dictionary != nil {
                    ${target} = ${prefixedTypeName}(json: ${input})
                }`;
            }
            return `${target} = ${prefixedTypeName}(json: ${input})`;
        },
        toJsonTemplate(input, target) {
            if (context.isOptional) {
                return `${target} += ${input}!.toJSONString()`;
            }
            if (schema.nullable) {
                return `if ${input} != nil {
                    ${target} += ${input}!.toJSONString()
                } else {
                    ${target} += "null" 
                }`;
            }
            return `${target} += ${input}.toJSONString()`;
        },
        toQueryStringTemplate(_, __, ___) {
            return `print("[WARNING] nested objects cannot be serialized to query params. Skipping field at ${context.instancePath}.")`;
        },
        cloneTemplate(input, key) {
            let fieldContent = `${key.split("`").join("")}: self.${key}.clone()`;
            if (isNullable) {
                fieldContent = `${key.split("`").join("")}: self.${key}?.clone()`;
            }
            return {
                tempKey: "",
                bodyContent: "",
                fieldContent,
            };
        },
        content: "",
    };
    if (context.generatedTypes.includes(typeName)) {
        return result;
    }
    const fieldNames: string[] = [];
    const fieldNameParts: string[] = [];
    const initArgParts: string[] = [];
    const initBodyParts: string[] = [];
    const initFromJsonParts: string[] = [];
    const toJsonParts: string[] = [];
    const toQueryStringParts: string[] = [];
    const cloneBodyParts: string[] = [];
    const cloneFieldParts: string[] = [];
    const subContent: string[] = [];
    let numKeys = 0;
    let canBeQueryString = false;
    let hasRecursiveSubType = false;
    if (context.discriminatorKey && context.discriminatorValue) {
        numKeys++;
        canBeQueryString = true;
        const discriminatorKey = validSwiftKey(context.discriminatorKey);
        fieldNames.push(discriminatorKey);
        fieldNameParts.push(
            `let ${discriminatorKey}: String = "${context.discriminatorValue}"`,
        );
        toJsonParts.push(
            `      __json += "\\"${context.discriminatorKey}\\":\\"${context.discriminatorValue}\\""`,
        );
        toQueryStringParts.push(
            `       __queryParts.append("${context.discriminatorKey}=${context.discriminatorValue}")`,
        );
    }
    for (const key of Object.keys(schema.properties)) {
        const subSchema = schema.properties[key]!;
        const subType = swiftTypeFromSchema(subSchema, {
            clientVersion: context.clientVersion,
            clientName: context.clientName,
            typePrefix: context.typePrefix,
            instancePath: `/${typeName}/${key}`,
            schemaPath: `${context.schemaPath}/properties/${key}`,
            generatedTypes: context.generatedTypes,
        });
        if (subType.content) subContent.push(subType.content);
        if (isSchemaFormRef(subSchema)) {
            hasRecursiveSubType = true;
        }
        if (subType.canBeQueryString) canBeQueryString = true;
        const fieldName = validSwiftKey(key);
        fieldNames.push(fieldName);
        if (subType.defaultValue) {
            fieldNameParts.push(
                `${codeComments(subSchema)}public var ${fieldName}: ${subType.typeName} = ${subType.defaultValue}`,
            );
        } else {
            fieldNameParts.push(
                `${codeComments(subSchema)}public var ${fieldName}: ${subType.typeName}`,
            );
        }
        initArgParts.push(`${fieldName}: ${subType.typeName}`);
        initBodyParts.push(`self.${fieldName} = ${fieldName}`);
        initFromJsonParts.push(
            subType.fromJsonTemplate(`json["${key}"]`, `self.${fieldName}`),
        );
        if (numKeys > 0) {
            toJsonParts.push(`__json += ",\\"${key}\\":"`);
        } else {
            toJsonParts.push(`__json += "\\"${key}\\":"`);
        }
        toJsonParts.push(subType.toJsonTemplate(`self.${fieldName}`, `__json`));
        if (!subType.canBeQueryString) canBeQueryString = true;
        toQueryStringParts.push(
            subType.toQueryStringTemplate(
                `self.${fieldName}`,
                `__queryParts`,
                key,
            ),
        );
        const cloneResult = subType.cloneTemplate?.(
            `self.${fieldName}`,
            fieldName,
        );
        if (cloneResult) {
            cloneBodyParts.push(cloneResult.bodyContent);
            cloneFieldParts.push(`${fieldName}: ${cloneResult.fieldContent}`);
        } else {
            cloneFieldParts.push(
                `${fieldName.split("`").join("")}: self.${fieldName}`,
            );
        }
        numKeys++;
    }
    for (const key of Object.keys(schema.optionalProperties ?? {})) {
        const subSchema = schema.optionalProperties![key]!;
        const subType = swiftTypeFromSchema(subSchema, {
            clientVersion: context.clientVersion,
            clientName: context.clientName,
            typePrefix: context.typePrefix,
            instancePath: `/${typeName}/${key}`,
            schemaPath: `${context.schemaPath}/optionalProperties/${key}`,
            generatedTypes: context.generatedTypes,
            isOptional: true,
        });
        //// TODO
    }
    const declaration = hasRecursiveSubType ? `class` : "struct";
    const initPrefix = hasRecursiveSubType ? `public required` : `public`;
    const initJsonStringPrefix = hasRecursiveSubType
        ? `public required convenience`
        : `public`;
    result.content = `${codeComments(schema)}public ${declaration} ${prefixedTypeName}: ArriClientModel {
${fieldNameParts.join("\n")}
    ${initPrefix} init(
${initArgParts.join(",\n")}
    ) {
${initBodyParts.join("\n")}
    }
    ${initPrefix} init() {}
    ${initPrefix} init(json: JSON) {
${initFromJsonParts.join("\n")}
    }
    ${initJsonStringPrefix} init(JSONString: String) {
        do {
            let data = try JSON(data:  JSONString.data(using: .utf8) ?? Data())
            self.init(json: data) 
        } catch {
            self.init()
        }
    }
    public func toJSONString() -> String {
        var __json = "{"
${numKeys === 0 ? `      var __numKeys = 0` : ""}
${toJsonParts.join("\n")}
        __json += "}"
        return __json
    }
    public func toQueryString() -> String {
        ${canBeQueryString ? `var __queryParts: [String] = []` : ""}
${toQueryStringParts.join("\n")}
        ${canBeQueryString ? `return __queryParts.joined(separator: "&")` : `return ""`}
    }
    public func clone() -> ${prefixedTypeName} {
${cloneBodyParts.join("\n")}
        return ${prefixedTypeName}(
${cloneFieldParts.join(",\n")}
        )
    }
}
    
${subContent.join("\n")}`;
    context.generatedTypes.push(typeName);
    return result;
}
