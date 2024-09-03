import { resolveGoogleCampaignManager360Conversion } from '../common-functions'
import { Settings } from '../generated-types'
import { CampaignManager360ConversionsBatchUpdateRequest } from '../types'
import { Payload } from './generated-types'

export function buildUpdateConversionBatchPayload(
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
    const conversion = resolveGoogleCampaignManager360Conversion(payload, settings)
    conversionsBatchUpdateRequest.conversions.push(conversion)
  }

  return conversionsBatchUpdateRequest
}
