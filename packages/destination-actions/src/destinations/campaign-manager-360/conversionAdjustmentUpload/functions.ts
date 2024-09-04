import { resolveGoogleCampaignManager360Conversion, validateEncryptionInfo } from '../common-functions'
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

  // Validation with `throw` is only done for one payload.
  // For batch requests, we will just log the error and continue with the rest of the payloads.
  if (payloads.length === 1 && payloads[0]) {
    const firstPayload = payloads[0]
    const resolvedEncryptionInfo = validateEncryptionInfo(
      firstPayload.encryptionEntityId,
      firstPayload.encryptionEntityType,
      firstPayload.encryptionSource,
      true
    )

    if (!resolvedEncryptionInfo) {
      conversionsBatchUpdateRequest.encryptionInfo = resolvedEncryptionInfo
    }

    const requiredId = firstPayload.requiredId
    if (
      !requiredId.gclid &&
      !requiredId.dclid &&
      !requiredId.encryptedUserId &&
      !requiredId.mobileDeviceId &&
      !requiredId.matchId
    ) {
      throw new Error(
        'Missing one of the required parameters: gclid, dclid, encrypted user id, match id, or mobile device id.'
      )
    }

    const conversion = resolveGoogleCampaignManager360Conversion(firstPayload, settings)
    conversionsBatchUpdateRequest.conversions.push(conversion)
    return conversionsBatchUpdateRequest
  }

  const firstPayload = payloads[0]
  const resolvedEncryptionInfo = validateEncryptionInfo(
    firstPayload.encryptionEntityId,
    firstPayload.encryptionEntityType,
    firstPayload.encryptionSource,
    false
  )

  if (!resolvedEncryptionInfo) {
    conversionsBatchUpdateRequest.encryptionInfo = resolvedEncryptionInfo
  }

  for (const payload of payloads) {
    const requiredId = payload.requiredId
    if (
      !requiredId.gclid &&
      !requiredId.dclid &&
      !requiredId.encryptedUserId &&
      !requiredId.mobileDeviceId &&
      !requiredId.matchId
    ) {
      // TODO: Log the error here.
      continue
    }

    const conversion = resolveGoogleCampaignManager360Conversion(payload, settings)
    conversionsBatchUpdateRequest.conversions.push(conversion)
  }

  return conversionsBatchUpdateRequest
}
