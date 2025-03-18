import { JSONSchema4, JSONSchema4Type, JSONSchema4TypeName } from 'json-schema'
import type {
  InputField,
  GlobalSetting,
  FieldTypeName,
  Optional,
  DependsOnConditions,
  FieldCondition,
  Condition
} from './types'

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
  omitRequiredSchemas?: boolean
}

const fieldKeyIsDotNotation = (fieldKey: string): boolean => {
  return fieldKey.split('.').length > 1
}

const generateThenStatement = (fieldKey: string): JSONSchema4 => {
  if (fieldKeyIsDotNotation(fieldKey)) {
    const [parentKey, childKey] = fieldKey.split('.')

    return {
      required: [parentKey],
      properties: {
        [parentKey]: {
          required: [childKey]
        }
      }
    }
  }

  return {
    required: [fieldKey]
  }
}

const undefinedConditionValueToJSONSchema = (
  dependantFieldKey: string,
  fieldKey: string,
  operator: 'is' | 'is_not',
  multiple?: boolean
): JSONSchema4 => {
  if (operator !== 'is' && operator !== 'is_not') {
    throw new Error(`Unsupported conditionally required field operator: ${operator}`)
  }

  const insideIfStatement: JSONSchema4 =
    operator === 'is' ? { not: { required: [dependantFieldKey] } } : { required: [dependantFieldKey] }

  if (multiple) {
    return insideIfStatement
  }

  if (operator === 'is') {
    const fieldIsNull: JSONSchema4 = { properties: { [dependantFieldKey]: { type: 'null' } } }
    return {
      if: { anyOf: [insideIfStatement, fieldIsNull] },
      then: generateThenStatement(fieldKey)
    }
  }

  // operator === 'is_not'
  const fieldIsNotNull: JSONSchema4 = { not: { properties: { [dependantFieldKey]: { type: 'null' } } } }
  return {
    if: { allOf: [insideIfStatement, fieldIsNotNull] },
    then: generateThenStatement(fieldKey)
  }
}

const simpleConditionToJSONSchema = (
  dependantFieldKey: string,
  fieldKey: string,
  dependantValue: string,
  operator: 'is' | 'is_not',
  multiple?: boolean
): JSONSchema4 => {
  const dependantValueToJSONSchema: JSONSchema4 =
    operator === 'is' ? { const: dependantValue } : { not: { const: dependantValue } }

  if (multiple) {
    return {
      properties: { [dependantFieldKey]: dependantValueToJSONSchema },
      required: [dependantFieldKey]
    }
  }

  return {
    if: {
      required: [dependantFieldKey],
      properties: { [dependantFieldKey]: dependantValueToJSONSchema }
    },
    then: generateThenStatement(fieldKey)
  }
}

const objectConditionToJSONSchema = (
  objectParentKey: string,
  objectChildKey: string,
  fieldKey: string,
  dependantValue: string,
  operator: 'is' | 'is_not',
  multiple?: boolean
): JSONSchema4 => {
  const dependantValueToJSONSchema: JSONSchema4 =
    operator === 'is' ? { const: dependantValue } : { not: { const: dependantValue } }

  if (multiple) {
    return {
      properties: {
        [objectParentKey]: { properties: { [objectChildKey]: dependantValueToJSONSchema }, required: [objectChildKey] }
      },
      required: [objectParentKey]
    }
  }

  return {
    if: {
      properties: {
        [objectParentKey]: { properties: { [objectChildKey]: dependantValueToJSONSchema }, required: [objectChildKey] }
      },
      required: [objectParentKey]
    },
    then: generateThenStatement(fieldKey)
  }
}

export function fieldConditionSingleDependencyToJsonSchema(condition: Condition, fieldKey: string) {
  let jsonCondition: JSONSchema4 | undefined = undefined
  const innerCondition = condition

  // object handling
  const dependentFieldKey = (innerCondition as FieldCondition).fieldKey
  if (dependentFieldKey.split('.').length > 1) {
    const [parentKey, childKey] = dependentFieldKey.split('.')

    if (innerCondition.operator === 'is') {
      jsonCondition = objectConditionToJSONSchema(parentKey, childKey, fieldKey, innerCondition.value as string, 'is')
    } else if (innerCondition.operator === 'is_not') {
      jsonCondition = objectConditionToJSONSchema(
        parentKey,
        childKey,
        fieldKey,
        innerCondition.value as string,
        'is_not'
      )
    } else {
      throw new Error(`Unsupported conditionally required field operator: ${innerCondition.operator}`)
    }
    return jsonCondition
  }

  if (innerCondition.operator === 'is') {
    if (innerCondition.value === undefined) {
      return undefinedConditionValueToJSONSchema(innerCondition.fieldKey, fieldKey, 'is')
    }

    jsonCondition = simpleConditionToJSONSchema(
      (innerCondition as FieldCondition).fieldKey,
      fieldKey,
      innerCondition.value as string,
      'is'
    )
  } else if (innerCondition.operator === 'is_not') {
    if (innerCondition.value === undefined) {
      return undefinedConditionValueToJSONSchema(innerCondition.fieldKey, fieldKey, 'is_not')
    }

    jsonCondition = simpleConditionToJSONSchema(
      (innerCondition as FieldCondition).fieldKey,
      fieldKey,
      innerCondition.value as string,
      'is_not'
    )
  } else {
    throw new Error(`Unsupported conditionally required field operator: ${innerCondition.operator}`)
  }

  return jsonCondition
}

export function singleFieldConditionsToJsonSchema(
  fieldKey: string,
  singleFieldConditions: DependsOnConditions
): JSONSchema4 | undefined {
  let jsonCondition: JSONSchema4 | undefined = undefined

  if (singleFieldConditions.conditions.length === 1) {
    return fieldConditionSingleDependencyToJsonSchema(singleFieldConditions.conditions[0], fieldKey)
  }

  const innerConditionArray: JSONSchema4[] = []
  singleFieldConditions.conditions.forEach((innerCondition) => {
    const dependentFieldKey = (innerCondition as FieldCondition).fieldKey
    if (dependentFieldKey.split('.').length > 1) {
      const [parentKey, childKey] = dependentFieldKey.split('.')

      const conditionToJSON = objectConditionToJSONSchema(
        parentKey,
        childKey,
        fieldKey,
        innerCondition.value as string,
        innerCondition.operator,
        true
      )
      innerConditionArray.push(conditionToJSON)

      const innerIfStatement: JSONSchema4 =
        singleFieldConditions.match === 'any' ? { anyOf: innerConditionArray } : { allOf: innerConditionArray }
      jsonCondition = { if: innerIfStatement, then: generateThenStatement(fieldKey) }

      return jsonCondition
    }

    if (innerCondition.value === undefined) {
      innerConditionArray.push(
        undefinedConditionValueToJSONSchema(innerCondition.fieldKey, fieldKey, innerCondition.operator, true)
      )
    } else {
      const conditionToJSON = simpleConditionToJSONSchema(
        dependentFieldKey,
        fieldKey,
        innerCondition.value as string,
        innerCondition.operator,
        true
      )
      innerConditionArray.push(conditionToJSON)
    }
  })

  const innerIfStatement: JSONSchema4 =
    singleFieldConditions.match === 'any' ? { anyOf: innerConditionArray } : { allOf: innerConditionArray }
  jsonCondition = { if: innerIfStatement, then: { required: [fieldKey] } }

  return jsonCondition
}

export function conditionsToJsonSchema(allFieldConditions: Record<string, DependsOnConditions>): JSONSchema4 {
  const additionalSchema: JSONSchema4[] = []

  for (const [fieldKey, singleFieldCondition] of Object.entries(allFieldConditions)) {
    const jsonCondition = singleFieldConditionsToJsonSchema(fieldKey, singleFieldCondition)

    if (jsonCondition === undefined) {
      throw new Error(`Unsupported conditionally required field condition: ${singleFieldCondition}`)
    }

    if (jsonCondition) {
      additionalSchema.push(jsonCondition)
    }
  }

  if (additionalSchema.length === 0) {
    return {}
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
    } else if (field.type === 'string') {
      const { minimum = null, maximum = null } = field as InputField
      if (minimum) {
        schema.minLength = (field as InputField)?.minimum
      }
      if (maximum) {
        schema.maxLength = (field as InputField)?.maximum
      }
      console.log('minimum', minimum, 'maximum', maximum)
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
      const propertiesContainsConditionallyRequired = Object.values(field.properties).some(
        (field) => field.required && typeof field.required === 'object'
      )
      if (isMulti) {
        schema.items = fieldsToJsonSchema(field.properties, {
          additionalProperties: field?.additionalProperties || false,
          omitRequiredSchemas: propertiesContainsConditionallyRequired
        })
      } else {
        schema = {
          ...schema,
          ...fieldsToJsonSchema(field.properties, {
            additionalProperties: field?.additionalProperties || false,
            omitRequiredSchemas: propertiesContainsConditionallyRequired
          })
        }
      }

      for (const [propertyKey, objectField] of Object.entries(field.properties)) {
        if (objectField.required === true) {
          continue
        } else if (objectField.required && typeof objectField.required === 'object') {
          const dotNotationKey = `${key}.${propertyKey}`
          conditions[dotNotationKey] = objectField.required
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

  // When generating types for the generated-types.ts file conditions are ignored
  if (options?.tsType === true) {
    return {
      $schema: 'http://json-schema.org/schema#',
      type: 'object',
      additionalProperties: options?.additionalProperties || false,
      properties,
      required
    }
  }

  if (options?.omitRequiredSchemas === true) {
    return {
      $schema: 'http://json-schema.org/schema#',
      type: 'object',
      additionalProperties: options?.additionalProperties || false,
      properties,
      ...additionalSchema
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
