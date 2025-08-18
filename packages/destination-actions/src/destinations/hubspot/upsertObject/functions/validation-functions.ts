import { PayloadValidationError, StatsContext } from '@segment/actions-core'
import { Payload } from '../generated-types'
import { Association } from '../types'

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
    } else if (typeof value === 'string') {
      if (value.toLowerCase().trim() === 'true' || value.toLowerCase().trim() === 'false') {
        // If the value can be cast to a boolean
        cleanObj[cleanKey] = value.toLowerCase().trim() === 'true'
      } else {
        // This ensures that values like "123" will remain strings.
        cleanObj[cleanKey] = value.trim()
      }
    } else if (typeof value === 'object' && value !== null) {
      // If the value is an object
      cleanObj[cleanKey] = JSON.stringify(value).trim()
    } else if (value === null || typeof value === 'undefined') {
      // We can't correctly figure out the type of a property the value is null, so we exclude it
      delete cleanObj[cleanKey]
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

/**
 * Merges an array of payloads by their unique `id_field_value`, deduplicating entries and merging their properties.
 *
 * For each unique ID:
 * - Properties and sensitive properties are merged, preferring values from the payload with the latest timestamp.
 * - Associations are merged.
 * - The resulting payload for each ID contains merged properties, sensitive properties, and associations.
 * - The `timestamp` field is used only for determining recency and is removed from the final output.
 *
 * @param payloads - An array of payloads to merge and deduplicate.
 * @returns An array of merged and deduplicated payloads, with timestamps removed.
 */
export function mergeAndDeduplicateById(payloads: Payload[], statsContext?: StatsContext): Payload[] {
  const mergedMap = new Map<string, Payload>()

  for (const incoming of payloads) {
    const id = incoming.object_details?.id_field_value
    if (!id) continue

    const incomingTimestamp = incoming.timestamp ? new Date(incoming.timestamp).getTime() : 0

    const existing = mergedMap.get(id)
    if (!existing) {
      mergedMap.set(id, { ...incoming })
      continue
    }

    const existingTimestamp = existing.timestamp ? new Date(existing.timestamp).getTime() : 0
    statsContext?.statsClient?.incr('hubspot.upsert_object.merged_payload', 1, statsContext?.tags)

    // Merge properties
    const mergedProps: Record<string, unknown> = { ...existing.properties }
    for (const [key, value] of Object.entries(incoming.properties || {})) {
      if (!(key in mergedProps) || incomingTimestamp >= existingTimestamp) {
        mergedProps[key] = value
      }
    }

    // Merge sensitive_properties
    const mergedSensProps: Record<string, unknown> = { ...existing.sensitive_properties }
    for (const [key, value] of Object.entries(incoming.sensitive_properties || {})) {
      if (!(key in mergedSensProps) || incomingTimestamp >= existingTimestamp) {
        mergedSensProps[key] = value
      }
    }

    // Merge associations
    const existingAssociations = existing.associations || []
    const incomingAssociations = incoming.associations || []

    const associationKey = (assoc: Association) =>
      `${assoc.object_type}|${assoc.association_label}|${assoc.id_field_name}|${assoc.id_field_value}`

    const existingAssocMap = new Map(existingAssociations.map((a) => [associationKey(a), a]))

    for (const assoc of incomingAssociations) {
      const key = associationKey(assoc)
      if (!existingAssocMap.has(key)) {
        statsContext?.statsClient?.incr('hubspot.upsert_object.merged_associations', 1, statsContext?.tags)
        existingAssocMap.set(key, assoc)
      }
    }

    const mergedAssociations = Array.from(existingAssocMap.values())

    // Save merged record with the latest timestamp
    mergedMap.set(id, {
      ...existing,
      properties: mergedProps,
      sensitive_properties: mergedSensProps,
      associations: mergedAssociations,
      timestamp: incomingTimestamp >= existingTimestamp ? incoming.timestamp : existing.timestamp
    })
  }

  // Final output with timestamp removed
  return Array.from(mergedMap.values()).map(({ timestamp, ...rest }) => rest)
}

/**
 * Ensures that each payload in the provided array has a valid timestamp.
 * If a payload's timestamp is invalid, it attempts to use the corresponding timestamp from the `rawData` array if it is valid.
 * If neither is valid, it sets the timestamp to the current ISO date string.
 *
 * @param payloads - The array of payload objects to validate and update.
 * @param rawData - (Optional) An array of raw payload objects to use as a fallback for timestamps.
 * @returns The updated array of payloads with valid timestamps.
 */
export function ensureValidTimestamps(payloads: Payload[], rawData?: Payload[]): Payload[] {
  payloads.forEach((item, index) => {
    if (!isValidTimestamp(item.timestamp)) {
      item.timestamp =
        rawData && Array.isArray(rawData) && rawData[index] && isValidTimestamp(rawData[index]?.timestamp)
          ? rawData[index]?.timestamp
          : new Date().toISOString()
    }
  })
  return payloads
}

/**
 * Checks if the provided value is a valid timestamp.
 *
 * Accepts strings, numbers, or Date objects and verifies if they can be converted
 * to a valid date. Returns `true` if the value represents a valid timestamp,
 * otherwise returns `false`.
 *
 * @param ts - The value to validate as a timestamp.
 * @returns `true` if `ts` is a valid timestamp, otherwise `false`.
 */
function isValidTimestamp(ts: unknown): ts is string | number | Date {
  if (typeof ts === 'string' || typeof ts === 'number' || ts instanceof Date) {
    return !isNaN(new Date(ts).getTime())
  }
  return false
}
