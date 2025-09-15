import { Payload } from '../generated-types'
import { PayloadValidationError } from '@segment/actions-core'

export function validate(payload: Payload): Payload {
  if (payload.record_details.object_type !== 'contact' && typeof payload.record_details.object_id !== 'number') {
    throw new PayloadValidationError('object_id is required and must be numeric')
  }

  if (
    payload.record_details.object_type === 'contact' &&
    typeof payload.record_details.object_id !== 'number' &&
    !payload.record_details.email &&
    !payload.record_details.utk
  ) {
    throw new PayloadValidationError(
      'Contact requires at least one of object_id (as number), email or utk to be provided'
    )
  }

  cleanIdentifiers(payload)
  payload.event_name = cleanEventName(payload.event_name)
  payload.properties = cleanPropObj(payload.properties ?? {})

  return payload
}

function cleanIdentifiers(payload: Payload) {
  if (payload.record_details.email && payload.record_details.object_type !== 'contact') {
    delete payload.record_details.email
  }

  if (payload.record_details.utk && payload.record_details.object_type !== 'contact') {
    delete payload.record_details.utk
  }
}

export function cleanEventName(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .trim()
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
    } else if (
      typeof value === 'string' &&
      (value.toLowerCase().trim() === 'true' || value.toLowerCase().trim() === 'false')
    ) {
      // If the value can be cast to a boolean
      cleanObj[cleanKey] = value.toLowerCase().trim() === 'true'
    } else if (!isNaN(Number(value))) {
      // If the value can be cast to a number
      cleanObj[cleanKey] = Number(value)
    } else if (typeof value === 'object' && value !== null) {
      // If the value is an object
      cleanObj[cleanKey] = JSON.stringify(value).trim()
    } else {
      // If the value is anything else then stringify it
      cleanObj[cleanKey] = String(value).trim()
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
