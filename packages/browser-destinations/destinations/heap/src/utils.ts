export function isDefined(value: string | undefined | null | number | object): boolean {
  if (typeof value === 'object') {
    return !!value && Object.keys(value).length !== 0
  }
  return !(value === undefined || value === null || value === '' || value === 0 || value === '0')
}

export type Properties = {
  [k: string]: unknown
}

type FlattenProperties = object & {
  [k: string]: string | null
}

export function flat(data?: Properties, prefix = ''): FlattenProperties | undefined {
  if (!isDefined(data)) {
    return undefined
  }
  let result: FlattenProperties = {}
  for (const key in data) {
    if (typeof data[key] == 'object' && data[key] !== null && !Array.isArray(data[key])) {
      const flatten = flat(data[key] as Properties, prefix + '.' + key)
      result = { ...result, ...flatten }
    } else {
      const stringifiedValue = stringify(data[key])
      result[(prefix + '.' + key).replace(/^\./, '')] = stringifiedValue
    }
  }
  return result
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const flattenProperties = (arrayPropertyValue: any) => {
  let arrayProperties = {}
  for (const [key, value] of Object.entries(arrayPropertyValue)) {
    if (typeof value == 'object' && value !== null) {
      arrayProperties = { ...arrayProperties, ...flat({ [key]: value as Properties }) }
    } else {
      const stringifiedValue = stringify(value)
      arrayProperties = Object.assign(arrayProperties, { [key]: stringifiedValue })
    }
  }
  return arrayProperties
}

function stringify(value: unknown): string | null {
  if (typeof value === 'string' || value === null) {
    return value
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return value.toString()
  }
  return JSON.stringify(value)
}
