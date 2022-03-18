"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fieldsToJsonSchema = void 0;
function toJsonSchemaType(type) {
    switch (type) {
        case 'string':
        case 'text':
        case 'password':
            return 'string';
        case 'datetime':
            return ['string', 'number'];
        default:
            return type;
    }
}
function fieldsToJsonSchema(fields = {}, options) {
    const required = [];
    const properties = {};
    for (const [key, field] of Object.entries(fields)) {
        const schemaType = toJsonSchemaType(field.type);
        let schema = {
            title: field.label,
            description: field.description,
            type: schemaType,
            format: field.format,
            default: field.default
        };
        if (field.type === 'datetime') {
            schema.format = 'date-like';
            if (options?.tsType) {
                schema.tsType = 'string | number';
            }
        }
        else if (field.type === 'password') {
            schema.format = 'password';
        }
        else if (field.type === 'text') {
            schema.format = 'text';
        }
        if (field.choices) {
            schema.enum = field.choices.map((choice) => {
                if (typeof choice === 'string') {
                    return choice;
                }
                return choice.value;
            });
        }
        if ('allowNull' in field && field.allowNull) {
            schema.type = [].concat(schemaType, 'null');
            if (schema.enum) {
                schema.enum = [...schema.enum, null];
            }
            if (typeof schema.tsType === 'string' && !schema.tsType.includes('null')) {
                schema.tsType += ' | null';
            }
        }
        const isMulti = 'multiple' in field && field.multiple;
        if (isMulti) {
            schema.items = { type: schemaType };
            schema.type = 'array';
            if (schema.enum) {
                schema.items.enum = schema.enum;
                delete schema.enum;
            }
        }
        if (schemaType === 'object' && field.properties) {
            if (isMulti) {
                schema.items = fieldsToJsonSchema(field.properties, { additionalProperties: field?.additionalProperties || false });
            }
            else {
                schema = { ...schema, ...fieldsToJsonSchema(field.properties, { additionalProperties: field?.additionalProperties || false }) };
            }
        }
        properties[key] = schema;
        if (field.required) {
            required.push(key);
        }
    }
    return {
        $schema: 'http://json-schema.org/schema#',
        type: 'object',
        additionalProperties: options?.additionalProperties || false,
        properties,
        required
    };
}
exports.fieldsToJsonSchema = fieldsToJsonSchema;
//# sourceMappingURL=fields-to-jsonschema.js.map