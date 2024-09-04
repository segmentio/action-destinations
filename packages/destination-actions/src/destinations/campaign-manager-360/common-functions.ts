import { createHash } from 'crypto'
import { RequestClient } from '@segment/actions-core/*'

import {
  CampaignManager360Conversion,
  CampaignManager360EncryptionEntityType,
  campaignManager360EncryptionEntityTypes,
  CampaignManager360EncryptionInfo,
  CampaignManager360EncryptionSource,
  campaignManager360EncryptionSources,
  CampaignManager360PayloadUserDetails,
  CampaignManager360RefreshTokenResponse,
  CampaignManager360Settings,
  CampaignManager360UserIdentifier
} from './types'
import { Payload as ConversionAdjustmentUpload } from './conversionAdjustmentUpload/generated-types'
import { Payload as ConversionUpload } from './conversionUpload/generated-types'
import { Settings } from './generated-types'

const isHashedInformation = (information: string): boolean => new RegExp(/[0-9abcdef]{64}/gi).test(information)
// Only exported for unit testing purposes.
export const hash = (value: string | undefined): string | undefined => {
  if (value === undefined) {
    return
  }

  const hash = createHash('sha256')
  hash.update(value)
  return hash.digest('hex')
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

export function resolveGoogleCampaignManager360Conversion(
  payload: ConversionAdjustmentUpload | ConversionUpload,
  settings: Settings
) {
  if (!payload.floodlightActivityId && !settings.defaultFloodlightActivityId) {
    throw new Error('Missing required parameter: floodlightActivityId.')
  }

  if (!payload.floodlightConfigurationId && !settings.defaultFloodlightConfigurationId) {
    throw new Error('Missing required parameter: floodlightConfigurationId.')
  }

  const conversion: CampaignManager360Conversion = {
    floodlightActivityId: String(payload.floodlightActivityId || settings.defaultFloodlightActivityId),
    floodlightConfigurationId: String(payload.floodlightConfigurationId || settings.defaultFloodlightConfigurationId),
    timestampMicros: (new Date(String(payload.timestamp)).getTime() / 1000).toFixed(0),
    value: payload.value,
    quantity: payload.quantity,
    ordinal: payload.ordinal,
    kind: 'dfareporting#conversion'
  }

  const requiredId = payload.requiredId

  if (requiredId.gclid) {
    conversion.gclid = requiredId.gclid
  }

  if (requiredId.dclid) {
    conversion.dclid = requiredId.dclid
  }

  // Optional fields.
  if (requiredId.encryptedUserId) {
    conversion.encryptedUserId = requiredId.encryptedUserId
  }

  if (requiredId.mobileDeviceId) {
    conversion.mobileDeviceId = requiredId.mobileDeviceId
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

  if (requiredId.matchId) {
    conversion.matchId = requiredId.matchId
  }

  if (requiredId.impressionId) {
    conversion.impressionId = requiredId.impressionId
  }

  // User Identifiers.
  const userIdentifiers: CampaignManager360UserIdentifier[] = []
  if (payload.userDetails) {
    userIdentifiers.push(...resolveGoogleCampaignManager360UserIdentifiers(payload.userDetails))
  }

  return conversion
}

export function resolveGoogleCampaignManager360CartData() {
  console.log('123')
}

export function resolveGoogleCampaignManager360UserIdentifiers(
  userDetails: CampaignManager360PayloadUserDetails
): CampaignManager360UserIdentifier[] {
  const userIdentifiers: CampaignManager360UserIdentifier[] = []
  if (userDetails.phone) {
    userIdentifiers.push({
      hashedPhoneNumber: isHashedInformation(userDetails.phone) ? userDetails.phone : hash(userDetails.phone)
    } as CampaignManager360UserIdentifier)
  }

  if (userDetails.email) {
    userIdentifiers.push({
      hashedEmail: isHashedInformation(userDetails.email) ? userDetails.email : hash(userDetails.email)
    } as CampaignManager360UserIdentifier)
  }

  const containsAddressInfo =
    userDetails.firstName ||
    userDetails.lastName ||
    userDetails.city ||
    userDetails.state ||
    userDetails.countryCode ||
    userDetails.postalCode ||
    userDetails.streetAddress

  if (containsAddressInfo) {
    userIdentifiers.push({
      addressInfo: {
        hashedFirstName: isHashedInformation(String(userDetails.firstName))
          ? userDetails.firstName
          : hash(userDetails.firstName),
        hashedLastName: isHashedInformation(String(userDetails.lastName))
          ? userDetails.lastName
          : hash(userDetails.lastName),
        hashedStreetAddress: isHashedInformation(String(userDetails.streetAddress))
          ? userDetails.streetAddress
          : hash(userDetails.streetAddress),
        city: userDetails.city,
        state: userDetails.state,
        countryCode: userDetails.countryCode,
        postalCode: userDetails.postalCode
      }
    })
  }

  return userIdentifiers
}

function isValidEncryptionEntityType(
  entityType: string | undefined
): entityType is CampaignManager360EncryptionEntityType {
  if (!entityType) {
    return false
  }
  return entityType in campaignManager360EncryptionEntityTypes
}

function isValidCustomVariableEncryptionSource(type: string | undefined): type is CampaignManager360EncryptionSource {
  if (!type) {
    return false
  }
  return type in campaignManager360EncryptionSources
}

export function validateEncryptionInfo(
  encryptionEntityId: string | undefined,
  encryptionEntityType: string | undefined,
  encryptionSource: string | undefined,
  shouldThrowException: boolean
): CampaignManager360EncryptionInfo | undefined {
  if (!encryptionEntityId && !encryptionEntityType && !encryptionSource) {
    return undefined
  }

  if (!isValidEncryptionEntityType(encryptionEntityType)) {
    if (shouldThrowException) {
      throw new Error('Invalid encryption entity type.')
    } else {
      // TODO: Log the error here.
      return undefined
    }
  }

  if (!isValidCustomVariableEncryptionSource(encryptionSource)) {
    if (shouldThrowException) {
      throw new Error('Invalid encryption source.')
    } else {
      // TODO: Log the error here.
      return undefined
    }
  }

  if (!encryptionEntityId) {
    if (shouldThrowException) {
      throw new Error('Encryption entity ID is required.')
    } else {
      // TODO: Log the error here.
      return undefined
    }
  }

  return {
    encryptionEntityId: encryptionEntityId,
    encryptionEntityType: encryptionEntityType,
    encryptionSource: encryptionSource,
    kind: 'dfareporting#encryptionInfo'
  }
}
