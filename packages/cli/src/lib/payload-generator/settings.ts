import { GlobalSetting } from '@segment/actions-core'
import { BrowserDestinationDefinition } from '@segment/destinations-manifest'
import { DestinationDefinition as CloudModeDestinationDefinition } from '@segment/actions-core'

/**
 * Generates sample settings based on schema.
 */
export function generateSampleFromSchema(schema: Record<string, GlobalSetting>): Record<string, any> {
  const result: Record<string, any> = {}
  for (const [propName, setting] of Object.entries(schema)) {
    if (setting.default !== undefined) {
      result[propName] = setting.default
    } else {
      result[propName] = generatePlaceholderForSchema(setting)
    }
  }

  return result
}

/**
 * Generates a placeholder value based on schema type.
 */
export function generatePlaceholderForSchema(schema: GlobalSetting): any {
  const type = schema.type

  switch (type) {
    case 'string':
      if (schema.choices) {
        return schema.choices[0]
      }
      return `<${schema.label || 'VALUE'}>`
    case 'number':
      return 0
    case 'boolean':
      return false
    case 'password':
      return `<${schema.label || 'PASSWORD'}>`
    default:
      return null
  }
}

/**
 * Generates destination settings based on destination type.
 */
export function generateDestinationSettings(destination: any): { settings: Object; auth: Object } {
  let settings: Object = {}
  let auth: Object = {}

  if ((destination as BrowserDestinationDefinition).mode === 'device') {
    // Generate sample settings based on destination settings schema
    const destinationSettings = (destination as BrowserDestinationDefinition).settings
    settings = generateSampleFromSchema(destinationSettings || {})
  } else {
    const destinationSettings = (destination as CloudModeDestinationDefinition).authentication?.fields
    settings = generateSampleFromSchema(destinationSettings || {})
    if ((destination as CloudModeDestinationDefinition).authentication?.scheme === 'oauth2') {
      auth = {
        accessToken: 'YOUR_ACCESS_TOKEN',
        refreshToken: 'YOUR_REFRESH_TOKEN'
      }
      settings = {
        ...settings,
        oauth: {
          ...auth
        }
      }
    }
  }

  return { settings, auth }
}
