import { PayloadValidationError } from '@segment/actions-core'
import { Payload } from '../generated-types'

export function validate(payloads: Payload[]): Payload[] {
  const length = payloads.length

  const cleaned: Payload[] = payloads.filter((payload) => {
    const fieldsToCheck = [
      payload.object_details.id_field_name,
      payload.object_details.id_field_value,
      payload.object_details.object_type
    ]
    return fieldsToCheck.every((field) => field !== null && field !== '')
  })

  if (length === 1 && cleaned.length === 0) {
    throw new PayloadValidationError(
      'Payload is missing required fields. Null or empty values are not allowed for "Object Type", "ID Field Name" or "ID Field Value".'
    )
  }

  cleaned.forEach((payload) => {
    payload.properties = cleanPropObj(payload.properties)
    payload.sensitive_properties = cleanPropObj(payload.sensitive_properties)

    payload.associations = payload.associations?.filter((association) => {
      const fieldsToCheck = [
        association.id_field_name,
        association.object_type,
        association.id_field_value,
        association.association_label
      ]
      return fieldsToCheck.every((field) => field !== null && field !== '')
    })
  })

  return cleaned
}

function cleanPropObj(
  obj: { [k: string]: unknown } | undefined
): { [k: string]: string | number | boolean } | undefined {
  const cleanObj: { [k: string]: string | number | boolean } = {}

  if (obj === undefined) {
    return undefined
  }

  Object.keys(obj).forEach((key) => {
    const value = obj[key]
    const cleanKey = cleanProp(key)

    if (typeof value === 'boolean' || typeof value === 'number') {
      cleanObj[cleanKey] = value
    } else if (typeof value === 'string' && (value.toLowerCase() === 'true' || value.toLowerCase() === 'false')) {
      // If the value can be cast to a boolean
      cleanObj[cleanKey] = value.toLowerCase() === 'true'
    } else if (!isNaN(Number(value))) {
      // If the value can be cast to a number
      cleanObj[cleanKey] = Number(value)
    } else if (typeof value === 'object' && value !== null) {
      // If the value is an object
      cleanObj[cleanKey] = JSON.stringify(value)
    } else {
      // If the value is anything else then stringify it
      cleanObj[cleanKey] = String(value)
    }
  })

  return cleanObj
}

function cleanProp(str: string): string {
  str = str.toLowerCase().replace(/[^a-z0-9_]/g, '_')

  if (!/^[a-z]/.test(str)) {
    throw new PayloadValidationError(
      `Property ${str} in event has an invalid name. Property names must start with a letter.`
    )
  }
  return str
}
