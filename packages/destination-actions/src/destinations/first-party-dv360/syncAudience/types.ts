export interface ContactInfo {
  hashedEmails?: string[]
  hashedPhoneNumbers?: string[]
  zipCodes?: string[]
  hashedFirstName?: string
  hashedLastName?: string
  countryCode?: string
}

export interface Consent {
  adUserData: string
  adPersonalization: string
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

export type Member = ContactInfo | string
