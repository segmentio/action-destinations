import { JSONPrimitive } from '@segment/actions-core'

export type Properties = {
  [k: string]: unknown
}

type FlattenProperties = object & {
  [k: string]: JSONPrimitive
}

export function flatten(
  data: Properties,
  prefix = '',
  skipList: string[] = [],
  keyTransformation = (input: string) => input
): FlattenProperties {
  let result: FlattenProperties = {}
  for (const key in data) {
    // skips flattening specific keys on the top level
    if (!prefix && skipList.includes(key)) continue

    if (typeof data[key] === 'object' && data[key] !== null) {
      const flattened = flatten(data[key] as Properties, `${prefix}_${key}`, skipList, keyTransformation)
      result = { ...result, ...flattened }
    } else {
      result[keyTransformation(`${prefix}_${key}`.replace(/^_/, ''))] = data[key] as JSONPrimitive
    }
  }
  return result
}
