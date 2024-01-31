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
        const list = object.map((x: any) => {
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

  private static removeDuplicates(array: Array<any>): Array<any> {
    // XXX TODO fix any types
    const primitives: any = { boolean: {}, number: {}, string: {} }
    const objects: Array<any> = []

    return array.filter((item: any) => {
      const type: string = typeof item
      if (type in primitives) {
        return primitives[type].hasOwnProperty(item) ? false : (primitives[type][item] = true)
      } else {
        return objects.indexOf(item) >= 0 ? false : objects.push(item)
      }
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
