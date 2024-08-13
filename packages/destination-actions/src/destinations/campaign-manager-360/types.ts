export interface CampaignManager360RefreshTokenResponse {
  access_token: string
  scope: string
  expires_in: number
  token_type: string
}

export interface CampaignManager360AddressInfo {
  hashedFirstName?: string
  hashedLastName?: string
  city?: string
  state?: string
  countryCode?: string
  postalCode?: string
  hashedStreetAddress?: string
}

export interface CampaignManager360ConversionsBatchInsertRequest {
  conversions: CampaignManager360Conversion[]
  encryptionInfo?: CampaignManager360EncryptionInfo
  kind: 'dfareporting#conversionsBatchInsertRequest'
}

export interface CampaignManager360CommonConversion {
  floodlightActivityId: string
  floodlightConfigurationId: string
  encryptedUserId?: string
  mobileDeviceId?: string
  timestampMicros?: number
  value?: number
  quantity?: number
  ordinal?: number
  customVariables?: CampaignManager360ConversionCustomVariable[]
  limitAdTracking?: boolean
  childDirectedTreatment?: boolean
  encryptedUserIdCandidates?: string[]
  gclid?: string
  nonPersonalizedAd?: boolean
  treatmentForUnderage?: boolean
  matchId?: string
  dclid?: string
  impressionId?: string
  userIdentifiers?: Record<string, string>
  kind: 'dfareporting#conversion'
  adUserDataConsent?: CampaignManager360ConsentStatus
}

export interface CampaignManager360Conversion extends CampaignManager360CommonConversion {}

export interface CampaignManager360ConversionAdjustment extends CampaignManager360CommonConversion {}

export interface CampaignManager360ConversionCustomVariable {
  key: string
  value: string
}

export interface CampaignManager360EncryptionInfo {
  encryptionEntityId: string
  encryptionEntityType: CampaignManager360EncryptionEntityType
  encryptionSource: CampaignManager360EncryptionSource
  kind: 'dfareporting#encryptionInfo'
}

export interface CampaignManager360Settings {
  clientId: string
  clientSecret: string
  refreshToken: string
}

export interface CampaignManager360UserIdentifier {
  hashedEmail?: string
  hashedPhoneNumber?: string
  addressInfo?: CampaignManager360AddressInfo
}

export type CampaignManager360ConsentStatus = 'GRANTED' | 'DENIED'

export type CampaignManager360EncryptionEntityType =
  | 'ADWORDS_CUSTOMER'
  | 'DBM_ADVERTISER'
  | 'DBM_PARTNER'
  | 'DCM_ACCOUNT'
  | 'DCM_ADVERTISER'
  | 'ENCRYPTION_ENTITY_TYPE_UNKNOWN'
  | 'DFP_NETWORK_CODE'

export type CampaignManager360EncryptionSource = 'AD_SERVING' | 'ENCRYPTION_SCOPE_UNKNOWN' | 'DATA_TRANSFER'
