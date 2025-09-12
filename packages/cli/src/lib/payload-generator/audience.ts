import { AudienceDestinationDefinition } from '@segment/actions-core'
import { set } from 'lodash'
import { generateSampleFromSchema } from './settings'

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
