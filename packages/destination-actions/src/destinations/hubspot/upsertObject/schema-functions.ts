import { IntegrationError } from '@segment/actions-core'
import { Payload } from './generated-types'
import {
  HSPropFieldType,
  HSPropType,
  HSPropTypeFieldType,
  Prop,
  Schema,
} from './types'

export function objectSchema(payloads: Payload[], objectType: string): Schema {
    const extractProperties = (propertyType: 'properties' | 'sensitive_properties'): Prop[] => {
      return Object.values(
        payloads.reduce((acc, payload) => {
          const properties = payload[propertyType]
          if (properties) {
            Object.entries(properties).forEach(([propName, value]) => {
              const typeData = format(value)
              acc[propName] = {
                name: propName,
                type: typeData.type,
                fieldType: typeData.fieldType,
                typeFieldType: formatHS(typeData.type, typeData.fieldType)
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
  
  function formatHS(type: HSPropType, fieldType: HSPropFieldType): HSPropTypeFieldType {
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
    }
    throw new IntegrationError('Property type not supported', 'HUBSPOT_PROPERTY_TYPE_NOT_SUPPORTED', 400)
  }