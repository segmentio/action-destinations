import { JSONSchema4, JSONSchema4Type, JSONSchema4TypeName } from 'json-schema'
import type { InputField, FieldTypeName, Optional } from './types'

function toJsonSchemaType(type: FieldTypeName): JSONSchema4TypeName | JSONSchema4TypeName[] {
  switch (type) {
    case 'string':
    case 'text':
    case 'password':
      return 'string'
    case 'datetime':
      return ['string', 'number']
    default:
      return type
  }
}

type MinimalInputField = Optional<InputField, 'description'>

export function fieldsToJsonSchema(fields: Record<string, MinimalInputField> = {}): JSONSchema4 {
  const required: string[] = []
  const properties: Record<string, JSONSchema4> = {}

  for (const [key, field] of Object.entries(fields)) {
    const schemaType = toJsonSchemaType(field.type)

    let schema: JSONSchema4 = {
      title: field.label,
      description: field.description,
      type: schemaType,
      format: field.format,
      default: field.default as JSONSchema4Type
    }

    if (field.type === 'datetime') {
      schema.format = 'date-like'
      // Override generated types
      schema.tsType = 'string | number'
    } else if (field.type === 'password') {
      schema.format = 'password'
    } else if (field.type === 'text') {
      schema.format = 'text'
    }

    if (field.dynamic) {
      schema.autocomplete = true
      schema.dynamic = true
    }

    if (field.allowNull) {
      schema.type = ([] as JSONSchema4TypeName[]).concat(schemaType, 'null')

      if (typeof schema.tsType === 'string' && !schema.tsType.includes('null')) {
        schema.tsType += ' | null'
      }
    }

    if (field.multiple) {
      schema.items = { type: schemaType }
      schema.type = 'array'
    }

    // Note: this is used for the json schema validation and type-generation,
    // but is not stored in the db. It only lives in the code.
    if (schemaType === 'object' && field.properties) {
      if (field.multiple) {
        schema.items = fieldsToJsonSchema(field.properties)
      } else {
        schema = { ...schema, ...fieldsToJsonSchema(field.properties) }
      }
    }

    properties[key] = schema

    // Grab all the field keys with `required: true`
    if (field.required) {
      required.push(key)
    }
  }

  return {
    $schema: 'http://json-schema.org/schema#',
    type: 'object',
    additionalProperties: false,
    properties,
    required
  }
}
