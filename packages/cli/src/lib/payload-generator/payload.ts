import Chance from 'chance'
import { get, set } from 'lodash'
import { isDirective, InputField, GlobalSetting, AudienceDestinationDefinition } from '@segment/actions-core'
import { getRawKeys } from '@segment/actions-core/mapping-kit/value-keys'
import { ErrorCondition, GroupCondition, parseFql } from '@segment/destination-subscriptions'
import { reconstructSegmentEvent } from '../event-generator'
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
export function generateDestinationSettings(destination: any): { settings: unknown; auth: unknown } {
  let settings: unknown
  let auth: unknown

  if ((destination as BrowserDestinationDefinition).mode === 'device') {
    // Generate sample settings based on destination settings schema
    const destinationSettings = (destination as BrowserDestinationDefinition).settings
    settings = generateSampleFromSchema(destinationSettings || {})
  } else if ((destination as CloudModeDestinationDefinition).mode === 'cloud') {
    const destinationSettings = (destination as CloudModeDestinationDefinition).authentication?.fields
    settings = generateSampleFromSchema(destinationSettings || {})
    if ((destination as CloudModeDestinationDefinition).authentication?.scheme === 'oauth2') {
      auth = {
        accessToken: 'YOUR_ACCESS_TOKEN',
        refreshToken: 'YOUR_REFRESH_TOKEN'
      }
    }
  }

  return { settings, auth }
}

/**
 * Generates audience settings based on the destination definition.
 */
export function generateAudienceSettings(destination: any): Record<string, any> {
  return {
    ...(destination as AudienceDestinationDefinition)?.audienceFields
  }
}

/**
 * Adds audience settings to a payload if applicable.
 */
export function addAudienceSettingsToPayload(payload: Record<string, any>, destination: any): Record<string, any> {
  const audienceSettings = generateAudienceSettings(destination)

  if (Object.keys(audienceSettings).length > 0) {
    const audienceSettingsValues = generateSampleFromSchema(audienceSettings || {})
    set(payload, 'context.personas.audience_settings', audienceSettingsValues)
  }

  return payload
}

/**
 * Generates a sample payload based on the given mapping, fields, and default subscription.
 */
export function generateSamplePayloadFromMapping(
  mapping: Record<string, any>,
  fields: Record<string, InputField>,
  defaultSubscription?: string
): Record<string, any> {
  const chance = new Chance('payload')

  const payload: Record<string, any> = {
    userId: chance.guid(),
    anonymousId: chance.guid(),
    event: 'Example Event',
    timestamp: new Date().toISOString(),
    context: {
      ip: chance.ip(),
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
      page: {
        path: `/${chance.word()}`,
        url: chance.url(),
        referrer: chance.url(),
        title: `${chance.capitalize(chance.word())} ${chance.capitalize(chance.word())}`
      },
      locale: chance.locale(),
      library: {
        name: 'analytics.js',
        version: `${chance.integer({ min: 1, max: 5 })}.${chance.integer({ min: 0, max: 20 })}.${chance.integer({
          min: 0,
          max: 99
        })}`
      }
    }
  }

  // Add properties based on mapping with better values
  for (const [key, value] of Object.entries(mapping)) {
    if (isDirective(value)) {
      const [pathKey] = getRawKeys(value)
      const path = pathKey.replace('$.', '')
      const fieldDefinition = fields[key]
      const existingValue = get(payload, path)
      const newValue = setTestData(fieldDefinition, key)
      if (typeof existingValue === 'object' && existingValue !== null && !Array.isArray(existingValue)) {
        set(payload, path, { ...existingValue, ...newValue })
      } else {
        set(payload, path, newValue)
      }
    }
  }

  if (defaultSubscription) {
    const parsed = parseFql(defaultSubscription)
    if ((parsed as ErrorCondition).error) {
      console.error(`Failed to parse FQL: ${(parsed as ErrorCondition).error}`)
    } else {
      const groupCondition = parsed as GroupCondition
      return reconstructSegmentEvent(groupCondition.children, payload)
    }
  }

  return payload
}

/**
 * Sets test data for a field based on its definition and name.
 */
export function setTestData(fieldDefinition: Omit<InputField, 'Description'>, fieldName: string) {
  const chance = new Chance('payload')
  const { type, format, choices, multiple } = fieldDefinition

  if (Array.isArray(choices)) {
    if (typeof choices[0] === 'object' && 'value' in choices[0]) {
      return choices[0].value
    }

    return choices[0]
  }
  let val: any
  switch (type) {
    case 'boolean':
      val = chance.bool()
      break
    case 'datetime':
      val = '2021-02-01T00:00:00.000Z'
      break
    case 'integer':
      val = chance.integer()
      break
    case 'number':
      val = chance.floating({ fixed: 2 })
      break
    case 'text':
      val = chance.sentence()
      break
    case 'object':
      if (fieldDefinition.properties) {
        val = {}
        for (const [key, prop] of Object.entries(fieldDefinition.properties)) {
          val[key] = setTestData(prop as Omit<InputField, 'Description'>, key)
        }
      }
      break
    default:
      // covers string
      switch (format) {
        case 'date': {
          const d = chance.date()
          val = [d.getFullYear(), d.getMonth() + 1, d.getDate()].map((v) => String(v).padStart(2, '0')).join('-')
          break
        }
        case 'date-time':
          val = chance.date().toISOString()
          break
        case 'email':
          val = chance.email()
          break
        case 'hostname':
          val = chance.domain()
          break
        case 'ipv4':
          val = chance.ip()
          break
        case 'ipv6':
          val = chance.ipv6()
          break
        case 'time': {
          const d = chance.date()
          val = [d.getHours(), d.getMinutes(), d.getSeconds()].map((v) => String(v).padStart(2, '0')).join(':')
          break
        }
        case 'uri':
          val = chance.url()
          break
        case 'uuid':
          val = chance.guid()
          break
        default:
          val = generateValueByFieldName(fieldName, chance)
          break
      }
      break
  }

  if (multiple) {
    val = [val]
  }

  return val
}

/**
 * Generates a test value based on field name patterns.
 */
export function generateValueByFieldName(fieldKey: string, chanceInstance?: Chance.Chance): any {
  const chance = chanceInstance || new Chance('payload')
  const lowerFieldName = fieldKey.toLowerCase()

  // Check for common field name patterns
  if (lowerFieldName.includes('email')) {
    return chance.email()
  } else if (lowerFieldName.includes('phone') || lowerFieldName.includes('mobile')) {
    return `+${chance.phone({ formatted: false })}`
  } else if (lowerFieldName.includes('name')) {
    if (lowerFieldName.includes('first')) {
      return chance.first()
    } else if (lowerFieldName.includes('last')) {
      return chance.last()
    } else if (lowerFieldName.includes('full')) {
      return chance.name()
    } else {
      return chance.name()
    }
  } else if (lowerFieldName.includes('url') || lowerFieldName.includes('link')) {
    return chance.url()
  } else if (lowerFieldName.includes('date')) {
    return chance.date().toISOString()
  } else if (lowerFieldName.includes('time')) {
    return chance.date().toISOString()
  } else if (
    lowerFieldName.includes('price') ||
    lowerFieldName.includes('amount') ||
    lowerFieldName.includes('total')
  ) {
    return chance.floating({ min: 1, max: 1000, fixed: 2 })
  } else if (lowerFieldName.includes('currency')) {
    return chance.currency().code
  } else if (lowerFieldName.includes('country')) {
    return chance.country()
  } else if (lowerFieldName.includes('city')) {
    return chance.city()
  } else if (lowerFieldName.includes('state') || lowerFieldName.includes('province')) {
    return chance.state()
  } else if (lowerFieldName.includes('zip') || lowerFieldName.includes('postal')) {
    return chance.zip()
  } else if (lowerFieldName.includes('address')) {
    return chance.address()
  } else if (lowerFieldName.includes('company') || lowerFieldName.includes('organization')) {
    return chance.company()
  } else if (lowerFieldName.includes('description')) {
    return chance.paragraph()
  } else if (lowerFieldName.includes('id')) {
    return chance.guid()
  } else if (lowerFieldName.includes('quantity') || lowerFieldName.includes('count')) {
    return chance.integer({ min: 1, max: 10 })
  } else if (lowerFieldName.includes('age')) {
    return chance.age()
  } else if (lowerFieldName === 'gender') {
    return chance.gender()
  } else if (
    lowerFieldName.includes('boolean') ||
    lowerFieldName.includes('enabled') ||
    lowerFieldName.includes('active')
  ) {
    return chance.bool()
  } else {
    // Default fallback
    return chance.word()
  }
}
