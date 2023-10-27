import {
    isSchemaFormDiscriminator,
    isSchemaFormElements,
    isSchemaFormEnum,
    isSchemaFormProperties,
    isSchemaFormType,
    isSchemaFormValues,
} from "jtd-utils";
import { camelCase, snakeCase } from "scule";
import {
    type AScalarSchema,
    type ASchema,
    type AObjectSchema,
    type AStringEnumSchema,
    type AArraySchema,
    type ADiscriminatorSchema,
    type ARecordSchema,
} from "../schemas";
import { type TemplateInput } from "./common";

export function createSerializationTemplate(
    inputName: string,
    schema: ASchema<any>,
) {
    const subFunctionNames: string[] = [];
    const subFunctionBodies: string[] = [];
    const mainTemplate = schemaTemplate({
        val: inputName,
        targetVal: "",
        schema,
        instancePath: "",
        schemaPath: "",
        subFunctionNames,
        subFunctionBodies,
    });
    const template = `${subFunctionBodies.join("\n")}
return \`${mainTemplate}\``;
    return template;
}

export function schemaTemplate(input: TemplateInput): string {
    if (isSchemaFormType(input.schema)) {
        switch (input.schema.type) {
            case "boolean":
                return booleanTemplate(input);
            case "string": {
                return stringTemplate(input);
            }
            case "timestamp": {
                return timestampTemplate(input);
            }
            case "float32":
            case "float64":
            case "int16":
            case "int32":
            case "int8":
            case "uint16":
            case "uint32":
            case "uint8":
                return numberTemplate(input);
            case "int64":
            case "uint64":
                return bigIntTemplate(input);
        }
    }
    if (isSchemaFormProperties(input.schema)) {
        return objectTemplate(input);
    }
    if (isSchemaFormEnum(input.schema)) {
        return stringEnumTemplate(input);
    }
    if (isSchemaFormElements(input.schema)) {
        return arrayTemplate(input);
    }
    if (isSchemaFormDiscriminator(input.schema)) {
        return discriminatorTemplate(input);
    }
    if (isSchemaFormValues(input.schema)) {
        return recordTemplate(input);
    }
    return `\${JSON.stringify(${input.val})}`;
}

export function stringTemplate(input: TemplateInput<AScalarSchema<"string">>) {
    const mainTemplate = input.instancePath.length
        ? `"\${${input.val}.replace(/[\\n]/g, "\\\\n")}"`
        : `\${${input.val}}`;
    if (input.schema.nullable) {
        return `\${typeof ${input.val} === 'string' ? \`${mainTemplate}\` : null}`;
    }
    return mainTemplate;
}

export function booleanTemplate(
    input: TemplateInput<AScalarSchema<"boolean">>,
) {
    if (input.schema.nullable) {
        return `\${typeof ${input.val} === 'boolean' ? ${input.val} : null}`;
    }
    return `\${${input.val}}`;
}

export function timestampTemplate(
    input: TemplateInput<AScalarSchema<"timestamp">>,
) {
    const mainTemplate = input.instancePath.length
        ? `"\${${input.val}.toISOString()}"`
        : `\${${input.val}.toISOString()}`;
    if (input.schema.nullable) {
        return `\${typeof ${input.val} === 'object' && ${input.val} !== null && ${input.val} instanceof Date ? \`${mainTemplate}\` : null}`;
    }
    return mainTemplate;
}

export function numberTemplate(input: TemplateInput<AScalarSchema>) {
    if (input.schema.nullable) {
        return `\${typeof ${input.val} === 'number' && !Number.isNaN(${input.val}) ? ${input.val} : null}`;
    }
    return `\${${input.val}}`;
}

export function bigIntTemplate(input: TemplateInput<AScalarSchema>) {
    const mainTemplate = input.instancePath.length
        ? `"\${${input.val}.toString()}"`
        : `\${${input.val}.toString()}`;
    if (input.schema.nullable) {
        return `\${typeof ${input.val} === 'bigint' ? \`${mainTemplate}\` : null}`;
    }
    return mainTemplate;
}

export function objectTemplate(input: TemplateInput<AObjectSchema>) {
    const fieldParts: string[] = [];
    if (input.schema.optionalProperties) {
        for (const key of Object.keys(input.schema.optionalProperties)) {
            const propSchema = input.schema.optionalProperties[key];
            const val = `${input.val}.${key}`;
            const template = schemaTemplate({
                val,
                targetVal: "",
                schema: propSchema,
                schemaPath: `${input.schemaPath}/optionalProperties/${key}`,
                instancePath: `${input.instancePath}/${key}`,
                subFunctionBodies: input.subFunctionBodies,
                subFunctionNames: input.subFunctionNames,
            });
            fieldParts.push(
                `\${${val} !== undefined ? \`"${key}":${template},\` : ''}`,
            );
        }
    }
    for (const key of Object.keys(input.schema.properties)) {
        const propSchema = input.schema.properties[key];
        const template = schemaTemplate({
            val: `${input.val}.${key}`,
            targetVal: "",
            schema: propSchema,
            schemaPath: `${input.schemaPath}/properties/${key}`,
            instancePath: `${input.instancePath}/${key}`,
            subFunctionBodies: input.subFunctionBodies,
            subFunctionNames: input.subFunctionNames,
        });
        fieldParts.push(`"${key}":${template},`);
    }
    if (input.discriminatorKey && input.discriminatorValue) {
        fieldParts.push(
            `"${input.discriminatorKey}":"\${${input.discriminatorValue}}",`,
        );
    }
    const allFieldsAreOptional =
        Object.keys(input.schema.properties).length === 0;
    let result = `{${fieldParts.join("")}}`;
    const position = result.lastIndexOf(",");
    if (allFieldsAreOptional) {
        result = `\${\`{${fieldParts.join("")}}\`.split(",}").join("}")}`;
    } else {
        result = result.substring(0, position) + result.substring(position + 1);
    }

    if (input.schema.nullable) {
        const fallback = input.instancePath.length ? "null" : '"null"';
        const actualResult = result;
        return `\${typeof ${input.val} === 'object' && ${input.val} !== null ? \`${actualResult}\` : ${fallback}}`;
    }
    return result;
}

export function stringEnumTemplate(
    input: TemplateInput<AStringEnumSchema<any>>,
) {
    const mainTemplate = input.instancePath.length
        ? `"\${${input.val}}"`
        : `\${${input.val}}`;
    if (input.schema.nullable) {
        return `\${typeof ${input.val} === 'string' ? \`${mainTemplate}\` : null}`;
    }
    return mainTemplate;
}

export function arrayTemplate(input: TemplateInput<AArraySchema<any>>) {
    const subTemplate = schemaTemplate({
        val: "item",
        targetVal: "",
        schema: input.schema.elements,
        schemaPath: `${input.schemaPath}/elements`,
        instancePath: `${input.instancePath}/0`,
        subFunctionBodies: input.subFunctionBodies,
        subFunctionNames: input.subFunctionNames,
    });
    const nullFallback = input.instancePath.length === 0 ? '"null"' : "null";
    if (input.schema.nullable) {
        return `\${Array.isArray(${input.val}) ? \`[\${${input.val}.map((item) => {return \`${subTemplate}\`}).join(",")}]\` : ${nullFallback}}`;
    }
    return `[\${${input.val}.map((item) => {return \`${subTemplate}\`}).join(",")}]`;
}

export function discriminatorTemplate(
    input: TemplateInput<ADiscriminatorSchema<any>>,
) {
    const subFunctionName = `${snakeCase(
        input.schema.metadata.id ?? input.instancePath,
    )}_to_json`;
    const subFunctionParts: string[] = [];
    const types = Object.keys(input.schema.mapping);
    for (const type of types) {
        const prop = input.schema.mapping[type];
        const template = schemaTemplate({
            val: "val",
            targetVal: "",
            schema: prop,
            schemaPath: `${input.schemaPath}/mapping`,
            instancePath: `${input.instancePath}`,
            discriminatorKey: input.schema.discriminator,
            discriminatorValue: `val.${input.schema.discriminator}`,
            subFunctionBodies: input.subFunctionBodies,
            subFunctionNames: input.subFunctionNames,
        });
        subFunctionParts.push(`case "${type}": 
  return \`${template}\`;
`);
    }
    const subFunction = `// @ts-ignore
    function ${subFunctionName}(val) {
            switch(val.${input.schema.discriminator}) {
                ${subFunctionParts.join("\n")}
                default:
                    return null;
            }
        }`;
    if (!input.subFunctionNames.includes(subFunctionName)) {
        input.subFunctionNames.push(subFunctionName);
        input.subFunctionBodies.push(subFunction);
    }
    if (input.schema.nullable) {
        return `\${${input.val} !== null ? ${subFunctionName}(${input.val}) : null}`;
    }
    return `\${${subFunctionName}(${input.val})}`;
}

export function recordTemplate(input: TemplateInput<ARecordSchema<any>>) {
    let subFunctionName = `${camelCase(
        input.schema.metadata.id ?? input.instancePath.split("/").join("_"),
    )}`;
    if (!subFunctionName.length) {
        subFunctionName = "serializeVal";
    }

    const subTemplate = schemaTemplate({
        val: "v",
        targetVal: "",
        schema: input.schema.values,
        schemaPath: `${input.schemaPath}/values`,
        instancePath: `${input.instancePath}`,
        subFunctionNames: [],
        subFunctionBodies: [],
    });

    const subFunction = `// @ts-ignore
    function ${subFunctionName}(val) {
        const keyParts = []
        const keys = Object.keys(val);
        for(let i = 0; i < Object.keys(val).length; i++) {
            const key = keys[i]
            const v = val[key]
            keyParts.push(\`"\${key}":${subTemplate}\`)
        }
        return \`{\${keyParts.join(',')}}\`
    }`;
    if (!input.subFunctionNames.includes(subFunctionName)) {
        input.subFunctionNames.push(subFunctionName);
        input.subFunctionBodies.push(subFunction);
    }
    if (input.schema.nullable) {
        return `\${${input.val} !== null ? ${subFunctionName}(${input.val}) : null}`;
    }
    return `\${${subFunctionName}(${input.val})}`;
}
