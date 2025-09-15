import { HTTPError } from '@segment/actions-core'

export interface RefreshTokenResponse {
  access_token: string
  scope: string
  expires_in: number
  token_type: string
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
