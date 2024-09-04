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

export interface CampaignManager360ConversionsBatchUpdateRequest {
  conversions: CampaignManager360Conversion[]
  encryptionInfo?: CampaignManager360EncryptionInfo
  kind: 'dfareporting#conversionsBatchUpdateRequest'
}

export interface CampaignManager360ConversionsBatchInsertRequest {
  conversions: CampaignManager360Conversion[]
  encryptionInfo?: CampaignManager360EncryptionInfo
  kind: 'dfareporting#conversionsBatchInsertRequest'
}

type ExactlyOne<T, Keys extends keyof T = keyof T> = {
  [K in Keys]: Pick<T, K> & Partial<Record<Exclude<Keys, K>, never>>
}[Keys]

type ExactlyOneIdentifier = ExactlyOne<{
  encryptedUserId?: string
  mobileDeviceId?: string
  matchId?: string
  gclid?: string
  dclid?: string
  impressionId?: string
  encryptedUserIdCandidates?: string[]
}>

export type CampaignManager360CommonConversion = ExactlyOneIdentifier & {
  floodlightActivityId: string
  floodlightConfigurationId: string
  encryptedUserId?: string
  mobileDeviceId?: string
  timestampMicros: string
  value: number
  quantity: string
  ordinal: string
  limitAdTracking?: boolean
  childDirectedTreatment?: boolean
  gclid?: string
  nonPersonalizedAd?: boolean
  treatmentForUnderage?: boolean
  matchId?: string
  dclid?: string
  impressionId?: string
  userIdentifiers?: CampaignManager360UserIdentifier[]
  kind: 'dfareporting#conversion'
  adUserDataConsent?: CampaignManager360ConsentStatus
  cartData?: CampaignManager360ConversionCartData
}

export type CampaignManager360ConversionCartData = {
  merchantId: string
  merchantFeedLabel: string
  merchantFeedLanguage: string
  items: CampaignManager360ConversionCartDataItem[]
}

export type CampaignManager360ConversionCartDataItem = {
  itemId: string
  quantity: number
  unitPrice: number
}

export type CampaignManager360Conversion = CampaignManager360CommonConversion & {
  // https://developers.google.com/doubleclick-advertisers/rest/v4/Conversion
  customVariables?: CampaignManager360ConversionCustomVariable[]
  encryptedUserIdCandidates?: string[]
}

export type CampaignManager360ConversionAdjustment = CampaignManager360CommonConversion

export interface CampaignManager360ConversionCustomVariable {
  type: CampaignManager360CustomFloodlightVariableType
  value: string
  kind: 'dfareporting#customFloodlightVariable'
}

export interface CampaignManager360EncryptionInfo {
  encryptionEntityId: string
  encryptionEntityType: CampaignManager360EncryptionEntityType
  encryptionSource: CampaignManager360EncryptionSource
  kind: 'dfareporting#encryptionInfo'
}

export interface CampaignManager360PayloadUserDetails {
  email?: string
  phone?: string
  firstName?: string
  lastName?: string
  streetAddress?: string
  city?: string
  state?: string
  postalCode?: string
  countryCode?: string
}

export interface CampaignManager360Settings {
  clientId: string
  clientSecret: string
  refreshToken: string
}

export type CampaignManager360UserIdentifier =
  | { hashedEmail: string }
  | { hashedPhoneNumber: string }
  | { addressInfo: CampaignManager360AddressInfo }

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

export type CampaignManager360CustomFloodlightVariableType =
  | 'U1'
  | 'U2'
  | 'U3'
  | 'U4'
  | 'U5'
  | 'U6'
  | 'U7'
  | 'U8'
  | 'U9'
  | 'U10'
  | 'U11'
  | 'U12'
  | 'U13'
  | 'U14'
  | 'U15'
  | 'U16'
  | 'U17'
  | 'U18'
  | 'U19'
  | 'U20'
  | 'U21'
  | 'U22'
  | 'U23'
  | 'U24'
  | 'U25'
  | 'U26'
  | 'U27'
  | 'U28'
  | 'U29'
  | 'U30'
  | 'U31'
  | 'U32'
  | 'U33'
  | 'U34'
  | 'U35'
  | 'U36'
  | 'U37'
  | 'U38'
  | 'U39'
  | 'U40'
  | 'U41'
  | 'U42'
  | 'U43'
  | 'U44'
  | 'U45'
  | 'U46'
  | 'U47'
  | 'U48'
  | 'U49'
  | 'U50'
  | 'U51'
  | 'U52'
  | 'U53'
  | 'U54'
  | 'U55'
  | 'U56'
  | 'U57'
  | 'U58'
  | 'U59'
  | 'U60'
  | 'U61'
  | 'U62'
  | 'U63'
  | 'U64'
  | 'U65'
  | 'U66'
  | 'U67'
  | 'U68'
  | 'U69'
  | 'U70'
  | 'U71'
  | 'U72'
  | 'U73'
  | 'U74'
  | 'U75'
  | 'U76'
  | 'U77'
  | 'U78'
  | 'U79'
  | 'U80'
  | 'U81'
  | 'U82'
  | 'U83'
  | 'U84'
  | 'U85'
  | 'U86'
  | 'U87'
  | 'U88'
  | 'U89'
  | 'U90'
  | 'U91'
  | 'U92'
  | 'U93'
  | 'U94'
  | 'U95'
  | 'U96'
  | 'U97'
  | 'U98'
  | 'U99'
  | 'U100'
