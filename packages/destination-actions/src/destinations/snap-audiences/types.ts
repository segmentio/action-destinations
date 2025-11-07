export interface RefreshTokenResponse {
  access_token: string
}

export interface SnapAudienceResponse {
  segments: {
    segment: {
      id: string
    }
  }[]
}

export interface CreateAudienceReq {
  segments: {
    name: string
    source_type: string
    ad_account_id: string
    description: string
    retention_in_days: number
  }[]
}
