import type { PropValue, Properties } from './types'

export function flatten(input: { [k: string]: unknown }): Properties {
  const result: Properties = {}
  for (const [key, val] of Object.entries(input))
    result[key] = Array.isArray(val) ? val.map(v => typeof v === 'object' ? JSON.stringify(v) : v).join(',') : val as PropValue
  return result
}
