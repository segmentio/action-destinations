import { JSONSchema4, JSONSchema4Type, JSONSchema4TypeName } from 'json-schema'
import type { InputField, GlobalSetting, FieldTypeName, Optional } from './types'

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

export type MinimalInputField = Optional<InputField, 'description'> | Optional<GlobalSetting, 'description'>

export type MinimalFields = Record<string, MinimalInputField>

interface SchemaOptions {
  tsType?: boolean
}

export function fieldsToJsonSchema(fields: MinimalFields = {}, options?: SchemaOptions): JSONSchema4 {
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

      if (options?.tsType) {
        // Override generated types
        schema.tsType = 'string | number'
      }
    } else if (field.type === 'password') {
      schema.format = 'password'
    } else if (field.type === 'text') {
      schema.format = 'text'
    }

    if (field.choices) {
      schema.enum = field.choices.map((choice) => {
        if (typeof choice === 'string') {
          return choice
        }

        return choice.value
      })
    }

    if ('allowNull' in field && field.allowNull) {
      schema.type = ([] as JSONSchema4TypeName[]).concat(schemaType, 'null')

      if (schema.enum) {
        schema.enum = [...schema.enum, null]
      }

      if (typeof schema.tsType === 'string' && !schema.tsType.includes('null')) {
        schema.tsType += ' | null'
      }
    }

    const isMulti = 'multiple' in field && field.multiple
    if (isMulti) {
      schema.items = { type: schemaType }
      schema.type = 'array'

      // Move to the items level
      if (schema.enum) {
        schema.items.enum = schema.enum
        delete schema.enum
      }
    }

    if (schemaType === 'object' && field.properties) {
      if (isMulti) {
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
