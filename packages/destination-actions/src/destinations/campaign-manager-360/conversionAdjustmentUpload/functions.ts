import { Settings } from '../generated-types'
import { CampaignManager360ConversionsBatchUpdateRequest } from '../types'
import { Payload } from './generated-types'

export function validateUpdateConversionPayloads(
  payloads: Payload[],
  settings: Settings
): CampaignManager360ConversionsBatchUpdateRequest {
  const conversionsBatchUpdateRequest: CampaignManager360ConversionsBatchUpdateRequest = {
    conversions: [],
    kind: 'dfareporting#conversionsBatchUpdateRequest'
  }

  for (const payload of payloads) {
    if (!payload.gclid && !payload.dclid && !payload.encryptedUserId && !payload.mobileDeviceId && !payload.matchId) {
      throw new Error(
        'Missing one of the required parameters: gclid, dclid, encrypted user id, match id, or mobile device id.'
      )
    }

    if (!payload.floodlightActivityId && !settings.defaultFloodlightActivityId) {
      throw new Error('Missing required parameter: floodlightActivityId.')
    }

    if (!payload.floodlightConfigurationId && !settings.defaultFloodlightConfigurationId) {
      throw new Error('Missing required parameter: floodlightConfigurationId.')
    }
  }

  return conversionsBatchUpdateRequest
}
