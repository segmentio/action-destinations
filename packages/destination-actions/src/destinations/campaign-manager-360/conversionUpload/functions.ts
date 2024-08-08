import { Payload } from './generated-types'
import { Settings } from '../generated-types'
import { CampaignManager360Conversion, CampaignManager360ConversionsBatchInsertRequest } from '../types'

export function validatePayloads(
  payloads: Payload[],
  settings: Settings
): CampaignManager360ConversionsBatchInsertRequest {
  const conversionsBatchInsertRequest: CampaignManager360ConversionsBatchInsertRequest = {
    conversions: [],
    kind: 'dfareporting#conversionsBatchInsertRequest'
  }

  for (const payload of payloads) {
    if (!payload.gclid && !payload.dclid) {
      throw new Error('Missing one of the required parameters: gclid or dclid.')
    }

    if (!payload.floodlightActivityId || !settings.defaultFloodlightActivityId) {
      throw new Error('Missing required parameter: floodlightActivityId.')
    }

    if (!payload.floodlightConfigurationId || !settings.defaultFloodlightConfigurationId) {
      throw new Error('Missing required parameter: floodlightConfigurationId.')
    }

    const conversion: CampaignManager360Conversion = {
      floodlightActivityId: payload.floodlightActivityId || settings.defaultFloodlightActivityId,
      floodlightConfigurationId: payload.floodlightConfigurationId || settings.defaultFloodlightConfigurationId
    }

    if (payload.gclid) {
      conversion.gclid = payload.gclid
    }

    if (payload.dclid) {
      conversion.dclid = payload.dclid
    }

    if (payload.ordinal) {
      conversion.ordinal = payload.ordinal
    }

    if (payload.quantity) {
      conversion.quantity = payload.quantity
    }

    if (payload.timestampMicros) {
      conversion.timestampMicros = payload.timestampMicros
    }

    if (payload.value) {
      conversion.value = payload.value
    }

    conversionsBatchInsertRequest.conversions.push(conversion)
  }

  return conversionsBatchInsertRequest
}
