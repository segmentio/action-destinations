import { Payload } from './generated-types'
import { Settings } from '../generated-types'
import {
  CampaignManager360Conversion,
  CampaignManager360ConversionsBatchInsertRequest,
  CampaignManager360RefreshTokenResponse,
  CampaignManager360Settings,
  CampaignManager360UserIdentifier
} from '../types'
import { RequestClient } from '@segment/actions-core/*'
import { hash, isHashedInformation } from '../common-functions'

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
    conversion.timestampMicros = payload.timestampMicros
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
    if (payload.phone) {
      userIdentifiers.push({
        hashedPhoneNumber: isHashedInformation(payload.phone) ? payload.phone : hash(payload.phone)
      } as CampaignManager360UserIdentifier)
    }

    if (payload.email) {
      userIdentifiers.push({
        hashedEmail: isHashedInformation(payload.email) ? payload.email : hash(payload.email)
      } as CampaignManager360UserIdentifier)
    }

    const containsAddressInfo =
      payload.firstName ||
      payload.lastName ||
      payload.city ||
      payload.state ||
      payload.countryCode ||
      payload.postalCode ||
      payload.streetAddress

    if (containsAddressInfo) {
      userIdentifiers.push({
        addressInfo: {
          hashedFirstName: isHashedInformation(String(payload.firstName)) ? payload.firstName : hash(payload.firstName),
          hashedLastName: isHashedInformation(String(payload.lastName)) ? payload.lastName : hash(payload.lastName),
          hashedStreetAddress: isHashedInformation(String(payload.streetAddress))
            ? payload.streetAddress
            : hash(payload.streetAddress),
          city: payload.city,
          state: payload.state,
          countryCode: payload.countryCode,
          postalCode: payload.postalCode
        }
      })
    }

    conversionsBatchInsertRequest.conversions.push(conversion)
  }

  return conversionsBatchInsertRequest
}

export async function refreshGoogleAccessToken(request: RequestClient, settings: unknown): Promise<string> {
  const campaignManager360Settings = settings as CampaignManager360Settings
  const refreshTokenResponse = await request<CampaignManager360RefreshTokenResponse>(
    'https://www.googleapis.com/oauth2/v4/token',
    {
      method: 'POST',
      body: new URLSearchParams({
        refresh_token: campaignManager360Settings.refreshToken,
        client_id: campaignManager360Settings.clientId,
        client_secret: campaignManager360Settings.clientSecret,
        grant_type: 'refresh_token'
      })
    }
  )

  if (!refreshTokenResponse.data.access_token) {
    throw new Error('Failed to refresh access token.')
  }

  return refreshTokenResponse.data.access_token
}
