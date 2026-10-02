import { StatsContext } from '@segment/actions-core/destination-kit'
import { Features } from '@segment/actions-core/mapping-kit'

export interface DV360AudienceResponse {
  firstPartyAndPartnerAudienceId?: string
  displayName?: string
  audienceType?: string
  appId?: string
  membershipDurationDays?: string
  firstPartyAndPartnerAudienceType?: string
  error?: {
    code?: number
    message?: string
    status?: string
  }
}

export interface CreateAudienceJSON {
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

export interface DV360ListAudiencesResponse {
  firstPartyAndPartnerAudiences?: DV360AudienceResponse[]
  nextPageToken?: string
  error?: DV360AudienceResponse['error']
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
