import { Payload } from './generated-types'
import { Settings } from '../generated-types'
import { CampaignManager360ConversionsBatchInsertRequest } from '../types'

import { resolveGoogleCampaignManager360Conversion } from '../common-functions'

export function buildInsertConversionBatchPayload(
  payloads: Payload[],
  settings: Settings
): CampaignManager360ConversionsBatchInsertRequest {
  const conversionsBatchInsertRequest: CampaignManager360ConversionsBatchInsertRequest = {
    conversions: [],
    kind: 'dfareporting#conversionsBatchInsertRequest'
  }

  for (const payload of payloads) {
    const requiredId = payload.requiredId
    if (
      !requiredId.gclid &&
      !requiredId.dclid &&
      !requiredId.encryptedUserId &&
      !requiredId.mobileDeviceId &&
      !requiredId.matchId &&
      !requiredId.impressionId &&
      (!payload.encryptedUserIdCandidates || payload.encryptedUserIdCandidates.length === 0)
    ) {
      throw new Error(
        'Missing one of the required parameters: gclid, dclid, encrypted user id, match id, impression id, mobile device id, or at least one encrypted user id candidate.'
      )
    }

    const conversion = resolveGoogleCampaignManager360Conversion(payload, settings)
    conversionsBatchInsertRequest.conversions.push(conversion)
  }

  return conversionsBatchInsertRequest
}
