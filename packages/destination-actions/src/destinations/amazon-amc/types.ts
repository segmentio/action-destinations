import { HTTPError } from '@segment/actions-core'
import { Settings } from './generated-types'
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

export class AmazonAdsError extends HTTPError {
  response: Response & {
    data: {
      status: string
      message: string
    }
  }
}

export interface AudiencePayload {
  name: string
  description: string
  countryCode: string
  targetResource: AMCTargetResource | DSPTargetResource
  metadata: {
    externalAudienceId: string
    ttl?: number
    audienceFees?: {
      cpmCents: number
      currency: string
    }[]
  }
}

export interface AMCTargetResource {
  amcInstanceId: String
  amcAccountId: string
  amcAccountMarketplaceId: string
  connectionId: string
}

export interface DSPTargetResource {
  advertiserId: string
}

export interface RecordsResponseType {
  jobRequestId: string
}

export type AmazonAMCCredentials = { refresh_token: string; access_token: string; client_id: string; client_secret: string }

export type SettingsWithOauth = Settings & { oauth: AmazonAMCCredentials }