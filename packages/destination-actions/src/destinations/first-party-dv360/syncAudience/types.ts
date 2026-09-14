import { CONSENT_STATUS_GRANTED, CONSENT_STATUS_DENIED } from './constants'

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

export interface Consent {
  adUserData: ConsentStatus
  adPersonalization: ConsentStatus
}

export interface ContactInfoList {
  contactInfos: ContactInfo[]
  consent: Consent
}

export interface MobileDeviceIdList {
  mobileDeviceIds: string[]
  consent: Consent
}

export interface EditCustomerMatchMembersRequest {
  advertiserId: string
  addedContactInfoList?: ContactInfoList
  removedContactInfoList?: ContactInfoList
  addedMobileDeviceIdList?: MobileDeviceIdList
  removedMobileDeviceIdList?: MobileDeviceIdList
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

export interface AudienceTarget {
  audienceId: string
  advertiserId: string
  audienceType: string
}
