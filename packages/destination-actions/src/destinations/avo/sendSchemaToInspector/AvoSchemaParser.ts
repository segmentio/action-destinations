/* eslint-disable no-prototype-builtins */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { EventProperty } from './avo-types'
import { encryptValue } from './eventSpec/AvoEncryption'

const isArray = (obj: any): boolean => {
  return Object.prototype.toString.call(obj) === '[object Array]'
}

export class AvoSchemaParser {
  /**
   * Returns true only if we have a valid encryption key and can send encrypted values.
   * If no key is present, returns false and no property values will be sent.
   */
  private static canSendEncryptedValues(publicEncryptionKey: string | undefined, env: string | undefined): boolean {
    const hasEncryptionKey = publicEncryptionKey != null && publicEncryptionKey !== ''
    const isDevOrStaging = env === 'dev' || env === 'staging'
    return hasEncryptionKey && isDevOrStaging
  }

  /**
   * Returns the encrypted property value if encryption is enabled, otherwise undefined.
   * Never returns unencrypted values - only encrypted or nothing.
   */
  private static getEncryptedPropertyValueIfEnabled(
    propertyValue: any,
    canEncrypt: boolean,
    publicEncryptionKey: string | undefined
  ): string | undefined {
    if (!canEncrypt || !publicEncryptionKey) {
      return undefined // No encryption key: do not send any property values
    }
    try {
      return encryptValue(propertyValue, publicEncryptionKey) // Only send encrypted values
    } catch (error) {
      // If encryption fails, log the error but don't fail the entire schema extraction
      console.error(
        '[Avo Inspector] Failed to encrypt property value:',
        error instanceof Error ? error.message : String(error)
      )
      return undefined
    }
  }

  static extractSchema(
    eventProperties: { [propName: string]: any },
    publicEncryptionKey?: string,
    env?: string
  ): Array<EventProperty> {
    if (eventProperties === null || eventProperties === undefined) {
      return []
    }

    const canSendEncryptedValues = this.canSendEncryptedValues(publicEncryptionKey, env)

    const mapping = (object: any): any => {
      if (isArray(object)) {
        const list = object.map((x: any) => {
          return mapping(x)
        })
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        return this.removeDuplicates(list)
      } else if (typeof object === 'object') {
        const mappedResult: Array<EventProperty> = []
        for (const key in object) {
          if (object.hasOwnProperty(key)) {
            const val = object[key]

            const mappedEntry: EventProperty = {
              propertyName: key,
              propertyType: this.getPropValueType(val)
            }

            if (typeof val === 'object' && val != null) {
              // Object/array properties: children are encrypted individually, no need to encrypt parent
              mappedEntry.children = mapping(val)
            } else if (val !== undefined && val !== null) {
              // Primitive properties: encrypt the value if encryption is enabled
              // Skip undefined and null values - they can't be encrypted and shouldn't be sent (will default to null)
              const encryptedValue = this.getEncryptedPropertyValueIfEnabled(
                val,
                canSendEncryptedValues,
                publicEncryptionKey
              )
              if (encryptedValue !== undefined) {
                mappedEntry.encryptedPropertyValue = encryptedValue
              }
            }

            mappedResult.push(mappedEntry)
          }
        }

        return mappedResult
      } else {
        return this.getPropValueType(object)
      }
    }

    // eventProperties is always an object (Record), so mapping returns EventProperty[]
    const mappedEventProps = mapping(eventProperties) as EventProperty[]

    return mappedEventProps
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static removeDuplicates(array: any[]): any[] {
    const uniqueItems = new Set<string>()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any[] = []

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

  private static getPropValueType(propValue: any): string {
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
      if (isArray(propValue)) {
        return 'list'
      } else {
        return 'object'
      }
    } else {
      return 'unknown'
    }
  }
}
