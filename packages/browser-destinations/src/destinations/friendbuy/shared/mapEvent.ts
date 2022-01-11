import { IntegrationError, JSONObject, JSONValue } from '@segment/actions-core'

import { isNonEmpty } from './util'

export type ConvertFun = (rawValue: unknown) => JSONValue

/**
 * ROOT is a special value to use for unmappedFieldObjectName that means to
 * copy unmapped fields to the root of the Friendbuy payload object.
 */
export const ROOT = Symbol('ROOT')

/**
 * COPY can be used for the simplest field definition that just copies a field
 * from the input to the output.
 */
export const COPY = {}
Object.freeze(COPY)

/**
 * DROP instructs `mapEvent` to drop the field from the Friendbuy payload object.
 */
export const DROP = Symbol('DROP')

export interface EventMap {
  /** A map that specifies how fields in the input payload should be handled. */
  fields: Record<string, FieldMap | typeof DROP>
  /** If defined, the name of an object that unmapped input fields will be added to. */
  unmappedFieldObject?: string | typeof ROOT
  /** Optionally sA object that defines default values for the objects properties. */
  defaultObject?: JSONObject
  /** A function that can modify the object. */
  finalize?: (o: JSONObject) => JSONObject
}

export interface FieldMap extends Partial<EventMap> {
  type?: 'array' | 'object'
  /** The name of the field in the output; defaults to the input name. */
  name?: string | string[]
  /** A function to convert the input value. */
  convert?: ConvertFun
}

export type AnalyticsPayload = Record<string, JSONValue>

/**
 * Transforms a payload from a Segment analytics call to a Friendbuy event payload.
 *
 * @param map A structure that describes how `analyticsPayload` fields are mapped to Friendbuy payload fields.
 * @param analyticsPayload The Segment analytics payload that was mapped from the merchant's track and passed to an action's `perform` function.
 * @returns the Friendbuy payload that will be passed to a Friendbuy track call or POSTed to Friendbuy's MAPI interface.
 */
export function mapEvent(map: EventMap, analyticsPayload: AnalyticsPayload) {
  const friendbuyPayload = mapEventHelper(map, analyticsPayload)
  if (!friendbuyPayload) {
    throw new IntegrationError('Payload has no supported fields', 'INVALID_REQUEST_DATA', 400)
  }
  return friendbuyPayload
}

export function mapEventHelper(map: EventMap, analyticsPayload: AnalyticsPayload) {
  // This function does not go to an enormous amount of effort to verify that
  // the actual shape of the analyticsPayload correctly matches the shape
  // expected by map, as it is expected that validation will be done on the
  // Friendbuy payload later.  However it shouldn't throw an exception if the
  // shape is wrong.

  // If the payload has a `friendbuyAttributes` attribute, copy its attributes
  // to the root, but don't override any fields that already exist on the root.
  if (analyticsPayload.friendbuyAttributes) {
    if (typeof analyticsPayload.friendbuyAttributes === 'object') {
      analyticsPayload = Object.assign({}, analyticsPayload.friendbuyAttributes, analyticsPayload)
    }
    delete analyticsPayload.friendbuyAttributes
  }

  let friendbuyPayload: JSONObject = Object.assign({}, map.defaultObject)

  for (const [key, rawValue] of Object.entries(analyticsPayload)) {
    const fieldMap = typeof map.fields === 'object' && map.fields[key]
    if (!fieldMap) {
      // If the input field does not have a mapping move it to the unmapped
      // output field object if one is defined.
      let value = rawValue
      if (isNonEmpty(rawValue)) {
        if (map.unmappedFieldObject) {
          let unmappedFieldObject = friendbuyPayload
          if (map.unmappedFieldObject !== ROOT) {
            if (typeof friendbuyPayload[map.unmappedFieldObject] !== 'object') {
              unmappedFieldObject = friendbuyPayload[map.unmappedFieldObject] = {}
            } else {
              unmappedFieldObject = friendbuyPayload[map.unmappedFieldObject] as JSONObject
            }
            // MAPI interface allows only string values in additional fields object.
            value = stringify(rawValue)
          }

          unmappedFieldObject[key] = value
        }
      }
    } else if (fieldMap === DROP) {
      // Ignore the field.
    } else {
      const name = fieldMap.name || key
      let value: JSONValue | undefined = fieldMap.convert ? fieldMap.convert(rawValue) : rawValue

      switch (fieldMap.type) {
        case 'object':
          value = mapEventHelper(fieldMap as EventMap, value as AnalyticsPayload)
          break
        case 'array':
          if (fieldMap.fields) {
            // Handle array of objects.
            value = (value as AnalyticsPayload[]).reduce((acc, o) => {
              const v = mapEventHelper(fieldMap as EventMap, o)
              if (v !== undefined) {
                acc.push(v)
              }
              return acc
            }, [] as JSONValue[])
          }
          break
        default:
          break
      }

      if (isNonEmpty(value)) {
        if (typeof name === 'string') {
          friendbuyPayload[name] = value
        } else {
          let o = friendbuyPayload
          for (let i = 0; i < name.length - 1; i++) {
            if (!(name[i] in o)) {
              o[name[i]] = {}
            }
            o = o[name[i]] as JSONObject
          }
          o[name[name.length - 1]] = value
        }
      }
    }
  }

  if (map.finalize) {
    friendbuyPayload = map.finalize(friendbuyPayload)
  }

  return isNonEmpty(friendbuyPayload) ? friendbuyPayload : undefined
}

export function stringify(rawValue: JSONValue) {
  switch (typeof rawValue) {
    case 'string':
      return rawValue
    case 'object':
      return JSON.stringify(rawValue)
    default:
      return rawValue.toString()
  }
}
