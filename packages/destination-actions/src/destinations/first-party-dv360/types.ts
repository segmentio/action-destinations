import { StatsContext } from '@segment/actions-core/destination-kit'
import { Features } from '@segment/actions-core/mapping-kit'

export interface DV360Audience {
  firstPartyAndPartnerAudienceId?: string
  displayName?: string
  audienceType?: string
  appId?: string
  membershipDurationDays?: string
  firstPartyAndPartnerAudienceType?: string
}

export interface CreateAudienceRequestParams {
  advertiserId: string
  audienceName: string
  description?: string
  membershipDurationDays: string
  audienceType: string
  appId?: string
  token?: string
  features?: Features
  statsContext?: StatsContext
}

export interface CreateAudienceResult {
  audienceId: string
  connectedToExisting: boolean
}

export interface GetAudienceParams {
  advertiserId: string
  audienceId: string
  token?: string
  features?: Features
  statsContext?: StatsContext
}

export interface GetAudienceByNameParams {
  advertiserId: string
  audienceName: string
  token?: string
  features?: Features
  statsContext?: StatsContext
}

export interface DV360EditCustomerMatchResponse {
  firstPartyAndPartnerAudienceId?: string
  error: [
    {
      code: string
      message: string
      status: string
    }
  ]
}

export interface DV360ErrorResponse {
  error?: {
    code?: number
    message?: string
    status?: string
  }
}

export type DV360AudienceResponse = DV360Audience & DV360ErrorResponse

export interface DV360ListAudiencesResponse extends DV360ErrorResponse {
  firstPartyAndPartnerAudiences?: DV360Audience[]
  nextPageToken?: string
}

export interface _CreateAudienceInput {
  audienceName: string
  settings: {
    oauth?: {
      refresh_token?: string
    }
  }
  audienceSettings: {
    advertiserId: string
    audienceType: string
    description?: string
    appId?: string
    membershipDurationDays?: string
    existingAudienceId?: string
    audienceDisplayName?: string
  }
  statsContext?: StatsContext
  features?: Features
}

export interface _GetAudienceInput {
  externalId: string
  settings: {
    oauth?: {
      refresh_token?: string
    }
  }
  audienceSettings: {
    advertiserId: string
    audienceType: string
    description?: string
    appId?: string
    membershipDurationDays?: string
    existingAudienceId?: string
  }
  statsContext?: StatsContext
  features?: Features
}
