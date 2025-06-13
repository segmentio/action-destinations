import { Payload as TrackPayload } from './trackEvent/generated-types'
import { Payload as IdentifyUserPayload } from './identifyUser/generated-types'
import { Payload as GroupUserPayload } from './groupUser/generated-types'
import { Payload as TrackPageViewPayload } from './trackPageView/generated-types'

/**
 * Utility functions to transform object fields back to individual key:value pairs
 * for RoadwayAI API compatibility
 */
type AllPayloads = TrackPayload | IdentifyUserPayload | GroupUserPayload | TrackPageViewPayload
/**
 * Transforms a payload with object fields into a flattened payload with individual key:value pairs
 * @param payload The payload containing object fields
 * @returns Flattened payload with individual properties
 */
export function flattenPayload<T>(payload: AllPayloads): T {
  const { app_properties, location_properties, page_properties, utm_properties, ...otherFields } =
    payload as Partial<AllPayloads> & Record<string, unknown>
  // Flatten the nested objects into individual properties
  return {
    ...otherFields,
    // Spread app properties as individual fields (app_name, app_version)
    ...(app_properties || {}),
    // Spread location properties as individual fields (country, region, language)
    ...(location_properties || {}),
    // Spread page properties as individual fields (url, referrer)
    ...(page_properties || {}),
    // Spread UTM properties as individual fields (utm_source, utm_medium, etc.)
    ...(utm_properties || {})
  } as T
}
/**
 * Transforms an array of payloads for batch operations
 * @param payloads Array of payloads containing object fields
 * @returns Array of flattened payloads with individual properties
 */
export function flattenPayloadBatch<T>(payloads: AllPayloads[]): T[] {
  return payloads.map(flattenPayload) as T[]
}
