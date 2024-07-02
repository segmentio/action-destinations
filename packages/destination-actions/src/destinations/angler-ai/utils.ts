import { InputField, PathDirective } from '@segment/actions-core/index'

export default function addPrefixToProperties(
  properties: Record<string, InputField>,
  prefix: string
): Record<string, InputField> {
  return Object.keys(properties).reduce((acc, key) => {
    acc[`${prefix}${key.charAt(0).toUpperCase()}${key.slice(1)}`] = properties[key]
    return acc
  }, {} as typeof properties)
}

export function addPrefixToDefaultFields(
  defaultFields: Record<string, object | PathDirective>,
  prefix: string,
  path = ''
): Record<string, object | PathDirective> {
  if (path && !path.endsWith('.')) {
    path += '.'
  }

  return Object.entries(defaultFields).reduce((acc, [key, value]) => {
    const newKey = `${prefix}${key.charAt(0).toUpperCase()}${key.slice(1)}`
    const newValue = '@path' in value ? { '@path': `${path}${newKey}` } : value
    acc[newKey] = newValue
    return acc
  }, {} as typeof defaultFields)
}
