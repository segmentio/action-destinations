import type { Payload } from '../generated-types'
import { SegmentProperty, SegmentPropertyType, StringFormat, Schema } from '../types'

export function eventSchema(payload: Payload): Schema {
  const { event_name, properties } = payload
  const props: { [key: string]: SegmentProperty } = {}

  if (properties) {
    Object.entries(properties).forEach(([property, value]) => {
      if (value !== null) {
        props[property] = {
          type: typeof value as SegmentPropertyType,
          stringFormat: typeof value === 'string' ? stringFormat(value) : undefined
        }
      }
    })
  }
  return { name: event_name, primaryObject: payload.record_details.object_type, properties: props }
}

function stringFormat(str: string): StringFormat {
  // Check for date or datetime, otherwise default to string
  const isoDateTimeRegex =
    /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])(?:([ T])(\d{2}):?(\d{2})(?::?(\d{2})(?:[,\.](\d{1,}))?)?(?:(Z)|([+\-])(\d{2})(?::?(\d{2}))?)?)?$/ //eslint-disable-line no-useless-escape
  const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/ //eslint-disable-line no-useless-escape

  if (isoDateTimeRegex.test(str)) {
    return dateOnlyRegex.test(str) ? 'date' : 'datetime'
  } else {
    return 'string'
  }
}
