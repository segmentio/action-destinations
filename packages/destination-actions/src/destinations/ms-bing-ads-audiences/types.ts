export interface RefreshTokenResponse {
  access_token: string
  refresh_token?: string
}

export interface CreateAudienceResponse {
  data: {
    AudienceIds: string[]
    PartialErrors: {
      FieldPath: string | null
      ErrorCode: string
      Message: string
      Code: number
      Details: string | null
      Index: number
      Type: string
      ForwardCompatibilityMap: null
    }[]
  }
}

export interface GetAudienceResponse {
  data: {
    Audiences: [
      {
        Id: string
      }
    ]
    PartialErrors: []
  }
}
