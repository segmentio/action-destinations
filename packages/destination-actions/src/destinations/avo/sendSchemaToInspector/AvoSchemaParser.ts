/* eslint-disable no-prototype-builtins */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { EventProperty } from './avo-types'

const isArray = (obj: any): boolean => {
  return Object.prototype.toString.call(obj) === '[object Array]'
}

export class AvoSchemaParser {
  static extractSchema(eventProperties: { [propName: string]: any }): Array<EventProperty> {
    if (eventProperties === null || eventProperties === undefined) {
      return []
    }

    const mapping = (object: any) => {
      if (isArray(object)) {
        const list: [EventProperty] = object.map((x: any) => {
          return mapping(x)
        })
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
              mappedEntry['children'] = mapping(val)
            }

            mappedResult.push(mappedEntry)
          }
        }
        return mappedResult
      } else {
        return []
      }
    }

    const mappedEventProps = mapping(eventProperties)

    return mappedEventProps
  }

  private static removeDuplicates(array: Array<EventProperty>): Array<EventProperty> {
    // Use a single object to track all seen propertyType:propertyName combinations
    const seen: Record<string, boolean> = {}

    return array.filter((item: EventProperty) => {
      // Create a unique key based on propertyName and propertyType
      const key = `${item.propertyName}:${item.propertyType}`

      if (!seen[key]) {
        seen[key] = true // Mark this key as seen
        return true // Include this item in the filtered result
      }
      // If the key was already seen, filter this item out
      return false
    })
  }

  private static getBasicPropType(propValue: any): string {
    const propType = typeof propValue
    if (propValue == null) {
      return 'null'
    } else if (propType === 'string') {
      return 'string'
    } else if (propType === 'number' || propType === 'bigint') {
      if ((propValue + '').indexOf('.') >= 0) {
        return 'float'
      } else {
        return 'int'
      }
    } else if (propType === 'boolean') {
      return 'boolean'
    } else if (propType === 'object') {
      return 'object'
    } else {
      return 'unknown'
    }
  }

  private static getPropValueType(propValue: any): string {
    if (isArray(propValue)) {
      //we now know that propValue is an array. get first element in propValue array
      const propElement = propValue[0]

      if (propElement == null) {
        return 'list' // Default to list if the list is empty.
      } else {
        const propElementType = this.getBasicPropType(propElement)
        return `list(${propElementType})`
      }
    } else {
      return this.getBasicPropType(propValue)
    }
  }
}
