export interface AuthTokenResp {
  access_token: string
  scope: string
  expires_in: number
  token_type: string
}

export interface AddressInfo {
  hashedFirstName?: string
  hashedLastName?: string
  city?: string
  state?: string
  countryCode?: string
  postalCode?: string
  hashedStreetAddress?: string
}

export interface UpdateRequest {
  conversions: Conversion[]
  encryptionInfo?: EncryptionInfo
  kind: 'dfareporting#conversionsBatchUpdateRequest'
}

export interface InsertRequest {
  conversions: Conversion[]
  encryptionInfo?: EncryptionInfo
  kind: 'dfareporting#conversionsBatchInsertRequest'
}

export type CartData = {
  merchantId: string
  merchantFeedLabel: string
  merchantFeedLanguage: string
  items: CartDataItem[]
}

export type CartDataItem = {
  itemId: string
  quantity: number
  unitPrice: number
}

export type Conversion = ConversionBase & {
  customVariables?: CustomVariable[]
  encryptedUserIdCandidates?: string[]
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

export type ConversionBase = ExactlyOneIdentifier & {
  adUserDataConsent?: ConsentType | undefined
  cartData?: CartData | undefined
  childDirectedTreatment?: boolean | undefined
  dclid?: string | undefined
  encryptedUserId?: string | undefined
  floodlightActivityId: string
  floodlightConfigurationId: string
  gclid?: string | undefined
  impressionId?: string | undefined
  kind: 'dfareporting#conversion'
  limitAdTracking?: boolean | undefined
  matchId?: string | undefined
  mobileDeviceId?: string | undefined
  nonPersonalizedAd?: boolean | undefined
  ordinal: string
  quantity: string
  timestampMicros: string
  treatmentForUnderage?: boolean | undefined
  userIdentifiers?: UserIdentifier[]
  value: number
}

export interface CustomVariable {
  type: CustomVarTypeChoices
  value: string
  kind: 'dfareporting#customFloodlightVariable'
}

export interface EncryptionInfo {
  encryptionEntityId: string
  encryptionEntityType: EntityType
  encryptionSource: Source
  kind: 'dfareporting#encryptionInfo'
}

export type UserIdentifier = { hashedEmail: string } | { hashedPhoneNumber: string } | { addressInfo: AddressInfo }

export const ConsentType = {
  GRANTED: 'GRANTED',
  DENIED: 'DENIED'
} as const

export type ConsentType = typeof ConsentType[keyof typeof ConsentType]

export const EntityType = {
  ADWORDS_CUSTOMER: 'ADWORDS_CUSTOMER',
  DBM_ADVERTISER: 'DBM_ADVERTISER',
  DBM_PARTNER: 'DBM_PARTNER',
  DCM_ACCOUNT: 'DCM_ACCOUNT',
  DCM_ADVERTISER: 'DCM_ADVERTISER',
  ENCRYPTION_ENTITY_TYPE_UNKNOWN: 'ENCRYPTION_ENTITY_TYPE_UNKNOWN',
  DFP_NETWORK_CODE: 'DFP_NETWORK_CODE'
} as const

export type EntityType = typeof EntityType[keyof typeof EntityType]

export const Source = {
  AD_SERVING: 'AD_SERVING',
  ENCRYPTION_SCOPE_UNKNOWN: 'ENCRYPTION_SCOPE_UNKNOWN',
  DATA_TRANSFER: 'DATA_TRANSFER'
} as const

export type Source = typeof Source[keyof typeof Source]

export const CustomVarTypeChoices = Array.from({ length: 100 }, (_, i) => `U${i + 1}`)

export type CustomVarTypeChoices = typeof CustomVarTypeChoices[number]
