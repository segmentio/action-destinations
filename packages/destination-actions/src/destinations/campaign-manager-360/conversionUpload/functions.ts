import { Payload } from './generated-types'
import { Settings } from '../generated-types'
import {
  CampaignManager360Conversion,
  CampaignManager360ConversionsBatchInsertRequest,
  CampaignManager360UserIdentifier
} from '../types'

import { resolveGoogleCampaignManager360UserIdentifiers } from '../common-functions'

export function validateInsertConversionPayloads(
  payloads: Payload[],
  settings: Settings
): CampaignManager360ConversionsBatchInsertRequest {
  const conversionsBatchInsertRequest: CampaignManager360ConversionsBatchInsertRequest = {
    conversions: [],
    kind: 'dfareporting#conversionsBatchInsertRequest'
  }

  for (const payload of payloads) {
    if (
      !payload.gclid &&
      !payload.dclid &&
      !payload.encryptedUserId &&
      !payload.mobileDeviceId &&
      !payload.matchId &&
      !payload.impressionId &&
      (!payload.encryptedUserIdCandidates || payload.encryptedUserIdCandidates.length === 0)
    ) {
      throw new Error(
        'Missing one of the required parameters: gclid, dclid, encrypted user id, match id, impression id, mobile device id, or at least one encrypted user id candidate.'
      )
    }

    if (!payload.floodlightActivityId && !settings.defaultFloodlightActivityId) {
      throw new Error('Missing required parameter: floodlightActivityId.')
    }

    if (!payload.floodlightConfigurationId && !settings.defaultFloodlightConfigurationId) {
      throw new Error('Missing required parameter: floodlightConfigurationId.')
    }

    const conversion: CampaignManager360Conversion = {
      floodlightActivityId: String(payload.floodlightActivityId || settings.defaultFloodlightActivityId),
      floodlightConfigurationId: String(payload.floodlightConfigurationId || settings.defaultFloodlightConfigurationId),
      kind: 'dfareporting#conversion'
    }

    // Required fields.
    conversion.timestampMicros = parseInt((new Date(String(payload.timestamp)).getTime() / 1000).toFixed(0))
    conversion.value = payload.value
    conversion.quantity = payload.quantity
    conversion.ordinal = payload.ordinal

    if (payload.gclid) {
      conversion.gclid = payload.gclid
    }

    if (payload.dclid) {
      conversion.dclid = payload.dclid
    }

    // Optional fields.
    if (payload.encryptedUserId) {
      conversion.encryptedUserId = payload.encryptedUserId
    }

    if (payload.mobileDeviceId) {
      conversion.mobileDeviceId = payload.mobileDeviceId
    }

    if (payload.limitAdTracking) {
      conversion.limitAdTracking = payload.limitAdTracking
    }

    if (payload.childDirectedTreatment) {
      conversion.childDirectedTreatment = payload.childDirectedTreatment
    }

    if (payload.nonPersonalizedAd) {
      conversion.nonPersonalizedAd = payload.nonPersonalizedAd
    }

    if (payload.treatmentForUnderage) {
      conversion.treatmentForUnderage = payload.treatmentForUnderage
    }

    if (payload.matchId) {
      conversion.matchId = payload.matchId
    }

    if (payload.impressionId) {
      conversion.impressionId = payload.impressionId
    }

    // User Identifiers.
    const userIdentifiers: CampaignManager360UserIdentifier[] = []
    if (payload.userDetails) {
      userIdentifiers.push(...resolveGoogleCampaignManager360UserIdentifiers(payload.userDetails))
    }

    conversionsBatchInsertRequest.conversions.push(conversion)
  }

  return conversionsBatchInsertRequest
}
