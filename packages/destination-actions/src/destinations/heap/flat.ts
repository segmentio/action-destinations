import { JSONValue } from '@segment/actions-core'

export type Properties = {
  [k: string]: unknown
}

type FlattenProperties = object & {
  [k: string]: JSONValue
}

export function flat(data: Properties, prefix = ''): FlattenProperties {
  let result: FlattenProperties = {}
  for (const key in data) {
    if (typeof data[key] == 'object' && data[key] !== null) {
      const flatten = flat(data[key] as Properties, prefix + '.' + key)
      result = { ...result, ...flatten }
    } else {
      result[(prefix + '.' + key).replace(/^\./, '')] = data[key] as JSONValue
    }
  }
  return result
}
