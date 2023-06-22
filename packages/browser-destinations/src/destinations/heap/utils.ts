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
  [k: string]: string
}

export function flat(data?: Properties, prefix = ''): FlattenProperties | undefined {
  if (!isDefined(data)) {
    return undefined
  }
  let result: FlattenProperties = {}
  for (const key in data) {
    if (typeof data[key] == 'object' && data[key] !== null) {
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
      arrayProperties = Object.assign(arrayProperties, { [key]: value })
    }
  }
  return arrayProperties
}

function stringify(value: unknown): string {
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return value.toString()
  }
  return JSON.stringify(value)
}
