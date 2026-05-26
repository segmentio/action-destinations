import { StatsContext } from '@segment/actions-core/destination-kit'
import { Features } from '@segment/actions-core/mapping-kit'

export interface CartItemInterface {
  productId?: string
  quantity?: number
  unitPrice?: number
}

export interface ConversionCustomVariable {
  conversionCustomVariable: {
    resourceName: string
    id: string
    name: string
  }
}

export interface GclidDateTimePairInterface {
  gclid: string | undefined
  conversionDateTime: string | undefined
}

export interface UserIdentifierInterface {
  hashedEmail?: string
  hashedPhoneNumber?: string
  addressInfo?: AddressInfoInterface
}

export interface AddressInfoInterface {
  hashedFirstName: string | undefined
  hashedLastName: string | undefined
  hashedStreetAddress: string | undefined
  city: string | undefined
  state: string | undefined
  postalCode: string | undefined
  countryCode: string | undefined
}

export interface RestatementValueInterface {
  adjustedValue: number | undefined
  currencyCode: string | undefined
}

export interface CartDataInterface {
  merchantId: string | undefined
  feedCountryCode: string | undefined
  feedLanguageCode: string | undefined
  localTransactionCost: number | undefined
  items: CartItemInterface[]
}

export interface ConsentInterface {
  adUserData?: string
  adPersonalization?: string
}

export interface CustomVariableInterface {
  conversionCustomVariable: string
  value: string
}

export interface CallConversionRequestObjectInterface {
  conversionAction: string
  callerId: string
  callStartDateTime: string | undefined
  consent?: ConsentInterface
  conversionDateTime: string | undefined
  conversionValue: number | undefined
  currencyCode: string | undefined
  customVariables?: CustomVariableInterface[]
}

export interface ConversionAdjustmentRequestObjectInterface {
  adjustmentType: string
  adjustmentDateTime: string | undefined
  conversionAction: string
  orderId: string | undefined
  gclidDateTimePair: GclidDateTimePairInterface | undefined
  userIdentifiers: UserIdentifierInterface[]
  userAgent: string | undefined
  restatementValue?: RestatementValueInterface
}
export interface ClickConversionRequestObjectInterface {
  cartData: CartDataInterface | undefined
  consent?: ConsentInterface
  conversionAction: string
  conversionDateTime: string | undefined
  conversionEnvironment: string | undefined
  conversionValue: number | undefined
  currencyCode: string | undefined
  customVariables?: CustomVariableInterface[]
  gclid: string | undefined
  gbraid: string | undefined
  wbraid: string | undefined
  userIpAddress?: string
  sessionAttributesEncoded?: string
  sessionAttributesKeyValuePairs?: {
    keyValuePairs: KeyValuePairList
  }
  orderId: string | undefined
  userIdentifiers: UserIdentifierInterface[]
}

export type KeyValuePairList = Array<KeyValueItem>

export type KeyValueItem = {
  sessionAttributeKey:
    | 'gad_source'
    | 'gad_campaignid'
    | 'landing_page_url'
    | 'session_start_time_usec'
    | 'landing_page_referrer'
    | 'landing_page_user_agent'
  sessionAttributeValue?: string
}

export interface ConversionActionId {
  conversionAction: {
    resourceName: string
    id: string
    name: string
  }
}

export interface ConversionActionResponse {
  results: Array<ConversionActionId>
  fieldMask: string
  requestId: string
}

export interface QueryResponse {
  results: Array<ConversionCustomVariable>
}

export interface PartialErrorResponse {
  partialFailureError: {
    code: number
    message: string
  }
  results: {}[]
}

export interface UserList {
  userList: {
    resourceName: string
    id: string
    name: string
  }
}

export interface UserListResponse {
  results: Array<UserList>
  fieldMask: string
}

export interface CreateAudienceInput {
  audienceName: string
  settings: {
    customerId?: string
    loginCustomerId?: string
    conversionTrackingId?: string
    oauth?: {
      refresh_token?: string
    }
  }
  audienceSettings: {
    external_id_type?: string
    app_id?: string
    supports_conversions?: boolean
  }
  statsContext?: StatsContext
  features?: Features
}

export interface GetAudienceInput {
  externalId: string
  settings: {
    customerId?: string
    conversionTrackingId?: string
    oauth?: {
      refresh_token?: string
    }
  }
  audienceSettings: {
    external_id_type: string
    app_id?: string
  }
  statsContext?: StatsContext
  features?: Features
}

export interface CreateGoogleAudienceResponse {
  resourceName?: string
  results: Array<{ resourceName: string }>
}

export interface AudienceSettings {
  external_id_type: string
}
export interface OfflineUserJobPayload {
  job: {
    type: string
    customerMatchUserListMetadata: {
      userList: string
      consent: {
        adUserData?: string
        adPersonalization?: string
      }
    }
  }
}

export interface AddOperationPayload {
  operations: any[]
  enablePartialFailure?: boolean
  enableWarnings?: boolean
}

// Data Manager API types
export interface DataManagerProductAccount {
  accountId: string
  accountType:
    | 'GOOGLE_ADS'
    | 'DATA_PARTNER'
    | 'DISPLAY_VIDEO_ADVERTISER'
    | 'DISPLAY_VIDEO_PARTNER'
    | 'GOOGLE_ANALYTICS_PROPERTY'
}

export interface DataManagerDestination {
  operatingAccount: DataManagerProductAccount
  loginAccount: DataManagerProductAccount
  linkedAccount?: DataManagerProductAccount
  productDestinationId: string
  reference?: string
}

export interface DataManagerConsent {
  adUserData: string
  adPersonalization: string
}

export interface DataManagerUserIdentifier {
  emailAddress?: string
  phoneNumber?: string
  address?: {
    givenName?: string
    familyName?: string
    postalCode?: string
    regionCode?: string
  }
}

export interface DataManagerUserData {
  userIdentifiers: DataManagerUserIdentifier[]
}

export interface DataManagerMobileData {
  mobileIds: string[]
  keySpace?: 'IOS' | 'ANDROID'
}

export interface DataManagerUserIdData {
  userId: string
}

export interface DataManagerAudienceMember {
  userData?: DataManagerUserData
  mobileData?: DataManagerMobileData
  userIdData?: DataManagerUserIdData
  consent?: DataManagerConsent
  destinationReferences?: string[]
}

export interface IngestAudienceMembersRequest {
  destinations: DataManagerDestination[]
  audienceMembers: DataManagerAudienceMember[]
  consent?: DataManagerConsent
  encoding?: string
  termsOfService?: {
    customerMatchTermsOfServiceStatus: 'ACCEPTED' | 'REJECTED' | 'UNSPECIFIED'
  }
  validateOnly?: boolean
}

export interface IngestAudienceMembersResponse {
  requestId: string
}

export interface PartnerLinkResponse {
  name: string // "accountTypes/GOOGLE_ADS/accounts/{CID}/partnerLinks/{ID}"
  partnerLinkId: string
  owningAccount: DataManagerProductAccount
  partnerAccount: DataManagerProductAccount
}

export interface DataManagerUserList {
  name: string // "accountTypes/GOOGLE_ADS/accounts/{CID}/userLists/{ID}"
  id: string
  displayName: string
  description?: string
  membershipDuration?: string
  uploadKeyTypes?: string[]
  membershipStatus?: string
}
