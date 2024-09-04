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

  // Validation with `throw` is only done for one payload.
  // For batch requests, we will just log the error and continue with the rest of the payloads.
  if (payloads.length === 1 && payloads[0]) {
    const requiredId = payloads[0].requiredId
    if (
      !requiredId.gclid &&
      !requiredId.dclid &&
      !requiredId.encryptedUserId &&
      !requiredId.mobileDeviceId &&
      !requiredId.matchId &&
      !requiredId.impressionId &&
      (!payloads[0].encryptedUserIdCandidates || payloads[0].encryptedUserIdCandidates.length === 0)
    ) {
      throw new Error(
        'Missing one of the required parameters: gclid, dclid, encrypted user id, match id, impression id, mobile device id, or at least one encrypted user id candidate.'
      )
    }

    const conversion = resolveGoogleCampaignManager360Conversion(payloads[0], settings)
    conversionsBatchInsertRequest.conversions.push(conversion)
    return conversionsBatchInsertRequest
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
      // TODO: Log the error here.
      continue
    }

    const conversion = resolveGoogleCampaignManager360Conversion(payload, settings)
    conversionsBatchInsertRequest.conversions.push(conversion)
  }

  return conversionsBatchInsertRequest
}
