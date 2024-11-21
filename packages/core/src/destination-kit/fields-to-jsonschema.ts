import { JSONSchema4, JSONSchema4Type, JSONSchema4TypeName } from 'json-schema'
import type { InputField, GlobalSetting, FieldTypeName, Optional, DependsOnConditions, FieldCondition } from './types'

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

export type MinimalInputField =
  | Optional<InputField, 'description'>
  | (Optional<GlobalSetting, 'description'> & { additionalProperties?: boolean })

export type MinimalFields = Record<string, MinimalInputField>

interface SchemaOptions {
  tsType?: boolean
  additionalProperties?: boolean
}
export function groupConditionsToJsonSchema(
  groups: { anyOf?: string[]; oneOf?: string[]; allOf?: string[] } | undefined
): JSONSchema4 {
  if (!groups) {
    return {}
  }

  const schema: JSONSchema4 = []

  if (groups.anyOf) {
    schema.anyOf = groups.anyOf.map((fieldKey) => {
      return { required: [fieldKey] }
    })
  }

  if (groups.oneOf) {
    schema.oneOf = groups.oneOf.map((fieldKey) => {
      return { required: [fieldKey] }
    })
  }

  if (groups.allOf) {
    schema.allOf = groups.allOf.map((fieldKey) => {
      return { required: [fieldKey] }
    })
  }

  return schema
}

export function singleConditionToJsonSchema(fieldKey: string, condition: DependsOnConditions): JSONSchema4 | undefined {
  let jsonCondition: JSONSchema4 | undefined = undefined

  if (condition.conditions.length === 1) {
    const innerCondition = condition.conditions[0]
    if (innerCondition.operator === 'is') {
      jsonCondition = {
        if: {
          properties: { [(innerCondition as FieldCondition).fieldKey]: { const: innerCondition.value } }
        },
        then: {
          required: [fieldKey]
        }
      }
    } else if (innerCondition.operator === 'is_not') {
      jsonCondition = {
        if: {
          properties: { [(innerCondition as FieldCondition).fieldKey]: { not: { const: innerCondition.value } } }
        },
        then: {
          required: [fieldKey]
        }
      }
    } else {
      throw new Error(`Unsupported conditionally required field operator: ${innerCondition.operator}`)
    }

    return jsonCondition
  }

  // if (condition.match === 'any') {
  const innerConditionArray: JSONSchema4[] = []
  condition.conditions.forEach((innerCondition) => {
    if (innerCondition.operator === 'is') {
      innerConditionArray.push({
        properties: { [(innerCondition as FieldCondition).fieldKey]: { const: innerCondition.value } },
        required: [`${(innerCondition as FieldCondition).fieldKey}`]
      })
    } else if (innerCondition.operator === 'is_not') {
      innerConditionArray.push({
        properties: { [(innerCondition as FieldCondition).fieldKey]: { not: { const: innerCondition.value } } },
        required: [`${(innerCondition as FieldCondition).fieldKey}`]
      })
    } else {
      throw new Error(`Unsupported conditionally required field operator: ${innerCondition.operator}`)
    }
  })
  const innerIfStatement: JSONSchema4 =
    condition.match === 'any' ? { anyOf: innerConditionArray } : { allOf: innerConditionArray }
  jsonCondition = { if: innerIfStatement, then: { required: [fieldKey] } }

  return jsonCondition
  // }
}

export function conditionsToJsonSchema(conditions: Record<string, DependsOnConditions>): JSONSchema4 {
  const additionalSchema: JSONSchema4[] = []

  for (const [fieldKey, condition] of Object.entries(conditions)) {
    const jsonCondition = singleConditionToJsonSchema(fieldKey, condition)

    if (jsonCondition === undefined) {
      throw new Error(`Unsupported conditionally required field condition: ${condition}`)
    }

    if (jsonCondition) {
      additionalSchema.push(jsonCondition)
    }
  }

  return { allOf: additionalSchema }
}

export function fieldsToJsonSchema(
  fields: MinimalFields = {},
  options?: SchemaOptions,
  additionalSchema?: JSONSchema4
): JSONSchema4 {
  const required: string[] = []
  const properties: Record<string, JSONSchema4> = {}
  const conditions: Record<string, DependsOnConditions> = {}

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
    } else if (field.type === 'number') {
      const { minimum = null, maximum = null } = field as InputField
      if (minimum) {
        schema.minimum = (field as InputField)?.minimum
      }
      if (maximum) {
        schema.maximum = (field as InputField)?.maximum
      }
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
        schema.items = fieldsToJsonSchema(field.properties, {
          additionalProperties: field?.additionalProperties || false
        })
      } else {
        schema = {
          ...schema,
          ...fieldsToJsonSchema(field.properties, { additionalProperties: field?.additionalProperties || false })
        }
      }
    }

    properties[key] = schema

    // Grab all the field keys with `required: true`
    if (field.required === true) {
      required.push(key)
    } else if (field.required && typeof field.required === 'object') {
      conditions[key] = field.required
    }
  }

  return {
    $schema: 'http://json-schema.org/schema#',
    type: 'object',
    additionalProperties: options?.additionalProperties || false,
    properties,
    required,
    ...conditionsToJsonSchema(conditions),
    ...additionalSchema
  }
}
