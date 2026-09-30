import { CONSENT_STATUS_GRANTED, CONSENT_STATUS_DENIED, COUNTRIES } from './constants'

export type CountryCode = typeof COUNTRIES[number]['code']

export interface ContactInfo {
  hashedEmails?: string[]
  hashedPhoneNumbers?: string[]
  zipCodes?: string[]
  hashedFirstName?: string
  hashedLastName?: string
  countryCode?: string
}

export type Member = ContactInfo | string

export type ConsentStatus = typeof CONSENT_STATUS_GRANTED | typeof CONSENT_STATUS_DENIED

// Each field is independent: an unset one means that dimension is not specified.
export interface Consent {
  adUserData?: ConsentStatus
  adPersonalization?: ConsentStatus
}

export interface ContactInfoList {
  contactInfos: ContactInfo[]
  // Omitted when the mapping carries no consent signals, which Display & Video 360 reads as
  // not specified.
  consent?: Consent
}

export interface MobileDeviceIdList {
  mobileDeviceIds: string[]
  consent?: Consent
}

// Every key but one is optional and typed never, so setting a second list is a compile error.
type ExactlyOne<T> = {
  [K in keyof T]: { [P in K]: T[P] } & { [P in Exclude<keyof T, K>]?: never }
}[keyof T]

// Display & Video 360 rejects a request carrying more than one list: "An edit customer match
// request can either add or remove customers. It cannot do both."
export type EditCustomerMatchMembersRequest = { advertiserId: string } & ExactlyOne<{
  addedContactInfoList: ContactInfoList
  removedContactInfoList: ContactInfoList
  addedMobileDeviceIdList: MobileDeviceIdList
  removedMobileDeviceIdList: MobileDeviceIdList
}>

export interface DV360Audience {
  firstPartyAndPartnerAudienceId?: string
  displayName?: string
  audienceType?: string
  appId?: string
  error?: {
    message?: string
  }
}

export interface EditCustomerMatchMembersResponse {
  firstPartyAndPartnerAudienceId?: string
  error?: {
    code?: number
    message?: string
    status?: string
  }
}

export interface HookOutputs {
  retlOnMappingSave?: {
    outputs?: {
      audienceId?: string
      advertiserId?: string
      audienceType?: string
      appId?: string
    }
  }
}

export type ResolvedAudience =
  | { audienceDetails: AudienceTarget; audienceErrorMessage?: undefined }
  | { audienceDetails?: undefined; audienceErrorMessage: string }

export interface AudienceTarget {
  audienceId: string
  advertiserId: string
  audienceType: string
}

export interface PhoneOptions {
  normalization?: string
  useContactInfoCountryCode?: boolean
  defaultCountryCode?: CountryCode
}
