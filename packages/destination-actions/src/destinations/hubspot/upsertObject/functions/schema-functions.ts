import { IntegrationError, StatsContext, PayloadValidationError } from '@segment/actions-core'
import { Payload } from '../generated-types'
import { HSPropFieldType, HSPropType, HSPropTypeFieldType, Prop, CachableSchema, SchemaDiff } from '../types'

export function objectSchema(payloads: Payload[], objectType: string): CachableSchema {
  const extractProperties = (propertyType: 'properties' | 'sensitive_properties'): Prop[] => {
    return Object.values(
      payloads.reduce((acc, payload) => {
        const properties = payload[propertyType]
        if (properties) {
          Object.entries(properties).forEach(([propName, value]) => {
            const typeData = format(value)
            const typeFieldType = formatHS(typeData.type, typeData.fieldType)

            if (typeFieldType === undefined) {
              throw new IntegrationError('Property type not supported', 'HUBSPOT_PROPERTY_TYPE_NOT_SUPPORTED', 400)
            }

            acc[propName] = {
              name: propName,
              type: typeData.type,
              fieldType: typeData.fieldType,
              typeFieldType
            }
          })
        }
        return acc
      }, {} as { [name: string]: Prop })
    )
  }

  const properties = extractProperties('properties')
  const sensitiveProperties = extractProperties('sensitive_properties')

  return {
    object_details: {
      object_type: objectType,
      id_field_name: payloads[0].object_details.id_field_name
    },
    properties,
    sensitiveProperties
  }
}

function format(value: unknown): { type: HSPropType; fieldType: HSPropFieldType } {
  switch (typeof value) {
    case 'object':
      return { type: HSPropType.String, fieldType: HSPropFieldType.Text }
    case 'number':
      return { type: HSPropType.Number, fieldType: HSPropFieldType.Number }
    case 'boolean':
      return { type: HSPropType.Enumeration, fieldType: HSPropFieldType.BooleanCheckbox }
    case 'string': {
      // Check for date or datetime, otherwise default to string
      const isoDateTimeRegex =
        /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])(?:([ T])(\d{2}):?(\d{2})(?::?(\d{2})(?:[,\.](\d{1,}))?)?(?:(Z)|([+\-])(\d{2})(?::?(\d{2}))?)?)?$/ //eslint-disable-line no-useless-escape
      const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/ //eslint-disable-line no-useless-escape

      if (isoDateTimeRegex.test(value as string)) {
        return {
          type: dateOnlyRegex.test(value as string) ? HSPropType.Date : HSPropType.DateTime,
          fieldType: HSPropFieldType.Date
        }
      } else {
        return { type: HSPropType.String, fieldType: HSPropFieldType.Text }
      }
    }
    case undefined:
    default:
      throw new IntegrationError(
        'Property must be an object, boolean, string or number',
        'HUBSPOT_PROPERTY_VALUE_UNDEFINED',
        400
      )
  }
}

export function formatHS(type: HSPropType, fieldType: HSPropFieldType): HSPropTypeFieldType | undefined {
  if (type === 'date' && fieldType === 'date') {
    return HSPropTypeFieldType.DateDate
  } else if (type === 'string' && fieldType === 'text') {
    return HSPropTypeFieldType.StringText
  } else if (type === 'number' && fieldType === 'number') {
    return HSPropTypeFieldType.NumberNumber
  } else if (type === 'datetime' && fieldType === 'date') {
    return HSPropTypeFieldType.DateTimeDate
  } else if (type === 'enumeration' && fieldType === 'booleancheckbox') {
    return HSPropTypeFieldType.EnumerationBooleanCheckbox
  } else if (type === 'string' && fieldType === 'textarea') {
    return HSPropTypeFieldType.StringTextArea
  }
  return undefined
}

export function compareSchemas(
  schema1: CachableSchema,
  schema2: CachableSchema | undefined,
  statsContext?: StatsContext
): SchemaDiff {
  if (schema2 === undefined) {
    return { match: 'no_match' }
  }

  if (schema1.object_details.object_type !== schema2.object_details.object_type) {
    statsContext?.statsClient?.incr('cache.compare.error1', 1, statsContext?.tags)
    throw new PayloadValidationError(
      "Hubspot.CustomObject.compareSchemas: Cache error - Schema object_type don't match"
    )
  }

  if (schema1.object_details.id_field_name !== schema2.object_details.id_field_name) {
    statsContext?.statsClient?.incr('cache.compare.error2', 1, statsContext?.tags)
    throw new PayloadValidationError(
      "Hubspot.CustomObject.compareSchemas: Cache error - Schema id_field_name don't match"
    )
  }

  const missingProps: Prop[] = []
  const missingSensitiveProps: Prop[] = []

  schema1.properties.forEach((prop1) => {
    if (!schema2.properties.some((prop2) => compareProps(prop1, prop2))) {
      missingProps.push(prop1)
    }
  })

  schema1.sensitiveProperties.forEach((prop1) => {
    if (!schema2.sensitiveProperties.some((prop2) => compareProps(prop1, prop2))) {
      missingSensitiveProps.push(prop1)
    }
  })

  return {
    match: missingProps.length > 0 || missingSensitiveProps.length > 0 ? 'properties_missing' : 'full_match',
    missingProperties: missingProps,
    missingSensitiveProperties: missingSensitiveProps
  }
}

function compareProps(prop1: Prop, prop2: Prop): boolean {
  if (prop1.name === prop2.name) {
    if (
      prop1.type === prop2.type &&
      prop1.fieldType === prop2.fieldType &&
      prop1.typeFieldType === prop2.typeFieldType
    ) {
      return true
    }
    if (
      prop1.type === prop2.type &&
      prop2.fieldType === 'select' &&
      prop2.type === 'enumeration' &&
      prop1.fieldType === 'text' &&
      prop1.type === 'string'
    ) {
      // string:text is OK to match to enumeration:select
      return true
    }
    if (
      prop1.type === prop2.type &&
      prop2.fieldType === 'textarea' &&
      prop2.type === 'string' &&
      prop1.fieldType === 'text' &&
      prop1.type === 'string'
    ) {
      // string:text is OK to match to textarea:string
      return true
    }
    throw new IntegrationError(
      `Payload property with name ${prop1.name} has a different type to the property in HubSpot. Expected: type = ${prop1.type} fieldType = ${prop1.fieldType}. Received: type = ${prop2.type} fieldType = ${prop2.fieldType}`,
      'HUBSPOT_PROPERTY_TYPE_MISMATCH',
      400
    )
  }
  return false
}
