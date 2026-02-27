import { EventProperty, SchemaChild } from '../types'
import { encryptValue } from './encryption-functions'

export function extractSchema(
  eventProperties: { [propName: string]: unknown },
  publicEncryptionKey?: string,
  env?: string
): Array<EventProperty> {
  if (!eventProperties) {
    return []
  }

  const hasEncryptionKey = typeof publicEncryptionKey === 'string' && publicEncryptionKey.length > 0
  const isDevOrStaging = env === 'dev' || env === 'staging'
  const canSendEncryptedValues = hasEncryptionKey && isDevOrStaging

  // Track visited objects to detect circular references
  const visited = new WeakSet<object>()

  const mapping = (obj: unknown): SchemaChild => {
    if (Array.isArray(obj)) {
      // Check for circular reference
      if (visited.has(obj)) {
        return 'list'
      }
      visited.add(obj)

      const list = obj.map((x: unknown) => {
        return mapping(x)
      })

      return removeDuplicates(list)
    } else if (typeof obj === 'object' && obj !== null) {
      // Check for circular reference
      if (visited.has(obj)) {
        return 'object'
      }
      visited.add(obj)

      const mappedResult: Array<EventProperty> = []
      for (const [key, val] of Object.entries(obj)) {
        const mappedEntry: EventProperty = {
          propertyName: key,
          propertyType: getPropValueType(val)
        }

        if (typeof val === 'object' && val != null) {
          // Object/array properties: children are encrypted individually, no need to encrypt parent
          mappedEntry.children = mapping(val)
        } else if (val !== undefined && val !== null) {
          // Primitive properties: encrypt the value if encryption is enabled
          // Skip undefined and null values - they can't be encrypted and shouldn't be sent (will default to null)
          const encryptedValue = getEncryptedPropertyValueIfEnabled(val, canSendEncryptedValues, publicEncryptionKey)
          if (encryptedValue !== undefined) {
            mappedEntry.encryptedPropertyValue = encryptedValue
          }
        }

        mappedResult.push(mappedEntry)
      }

      return mappedResult
    } else {
      return getPropValueType(obj)
    }
  }

  // eventProperties is always an object (Record), so mapping returns EventProperty[]
  const mappedEventProps = mapping(eventProperties) as EventProperty[]

  return mappedEventProps
}

/**
 * Returns the encrypted property value if encryption is enabled, otherwise undefined.
 * Never returns unencrypted values - only encrypted or nothing.
 */
function getEncryptedPropertyValueIfEnabled(
  propertyValue: unknown,
  canEncrypt: boolean,
  publicEncryptionKey: string | undefined
): string | undefined {
  if (!canEncrypt || !publicEncryptionKey) {
    return undefined // No encryption key: do not send any property values
  }
  try {
    return encryptValue(propertyValue, publicEncryptionKey) // Only send encrypted values
  } catch (error) {
    // If encryption fails, don't fail the entire schema extraction
    return undefined
  }
}

function removeDuplicates(array: SchemaChild[]): SchemaChild[] {
  const uniqueItems = new Set<string>()
  const result: SchemaChild[] = []

  for (const item of array) {
    let stringRep: string
    if (typeof item === 'object' && item !== null) {
      // For objects, we use JSON stringification for deduplication
      // This handles content-based deduplication (like Web SDK)
      // We sort keys to ensure {a:1, b:2} == {b:2, a:1}
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      stringRep = JSON.stringify(item, Object.keys(item).sort())
    } else {
      // For primitives, we prefix with type to avoid "1" == 1 collisions
      stringRep = typeof item + ':' + String(item)
    }

    if (!uniqueItems.has(stringRep)) {
      uniqueItems.add(stringRep)
      result.push(item)
    }
  }
  return result
}

function getPropValueType(propValue: unknown): string {
  const propType = typeof propValue
  if (propValue == null) {
    return 'null'
  } else if (propType === 'string') {
    return 'string'
  } else if (propType === 'number' || propType === 'bigint') {
    if ((propValue + '').includes('.')) {
      return 'float'
    } else {
      return 'int'
    }
  } else if (propType === 'boolean') {
    return 'boolean'
  } else if (propType === 'object') {
    if (Array.isArray(propValue)) {
      return 'list'
    } else {
      return 'object'
    }
  } else {
    return 'unknown'
  }
}
