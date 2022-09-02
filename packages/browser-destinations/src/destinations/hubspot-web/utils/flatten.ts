import { JSONValue } from '@segment/actions-core'

export type Properties = {
  [k: string]: unknown
}

type FlattenProperties = object & {
  [k: string]: JSONValue
}

export function flatten(data: Properties, prefix = '', skipList: string[] = []): FlattenProperties {
  let result: FlattenProperties = {}
  for (const key in data) {
    // skips flattening specific keys on the top level
    if (!prefix && skipList.includes(key)) continue

    if (typeof data[key] == 'object' && data[key] !== null) {
      const flattened = flatten(data[key] as Properties, `${prefix}_${key}`)
      result = { ...result, ...flattened }
    } else {
      result[`${prefix}_${key}`.replace(/^_/, '')] = data[key] as JSONValue
    }
  }
  return result
}
