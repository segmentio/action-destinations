import { HTTPError } from '@segment/actions-core'


export type MaybeString = string | undefined | null
export interface RefreshTokenResponse {
  access_token: string
  scope: string
  expires_in: number
  token_type: string
}

export interface GeographicConsentData {
  ipAddress?: string
}

export interface AmazonConsentFormat {
  amznAdStorage?: 'GRANTED' | 'DENIED'
  amznUserData?: 'GRANTED' | 'DENIED'
}

export interface ConsentData {
  geo?: GeographicConsentData
  amazonConsent?: AmazonConsentFormat
  tcf?: string
  gpp?: string
}

export class AmazonTestAuthenticationError extends HTTPError {
  response: Response & {
    data: {
      message: string
    }
  }
}

export class AmazonRefreshTokenError extends HTTPError {
  response: Response & {
    data: {
      error: string
      error_description: string
    }
  }
}

export interface HashedPIIObject {
  firstname?: string
  lastname?: string
  phone?: string
  city?: string
  state?: string
  postal?: string
  email?: string
  address?: string
}
export interface AudienceRecord {
  hashedPII: HashedPIIObject[]
  externalUserId: string
  countryCode: string
  action: string
  consent?: ConsentData
}
export interface TargetResourceRecords {
  connectionId: string
  targetTypes: string[]
}

export interface AudienceRecordPayload {
  records: AudienceRecord[]
  targetResource: TargetResourceRecords
  audienceId: number
}
