export type Properties = {
  [k: string]: unknown
}

type FlattenProperties = object & {
  [k: string]: string | number
}

export function flat(data: Properties, prefix = ''): FlattenProperties {
  let result: FlattenProperties = {}
  for (const key in data) {
    if (typeof data[key] == 'object' && data[key] !== null) {
      const flatten = flat(data[key] as Properties, prefix + '.' + key)
      result = { ...result, ...flatten }
    } else {
      const flatValue = getFlatValue(data[key])
      result[(prefix + '.' + key).replace(/^\./, '')] = flatValue
    }
  }
  return result
}

function getFlatValue(value: unknown): string | number {
  if (typeof value === 'string' || typeof value === 'number') {
    return value
  }
  if (typeof value === 'boolean') {
    return value.toString()
  }
  return JSON.stringify(value)
}
