export interface RefreshTokenResponse {
  access_token: string
  refresh_token?: string
}

export interface PartialError {
  FieldPath: string | null
  ErrorCode: string
  Message: string
  Code: number
  Details: string | null
  Index: number
  Type: string
  ForwardCompatibilityMap: null
}

export interface CreateAudienceResponse {
  data: {
    AudienceIds: string[]
    PartialErrors: PartialError[]
  }
}

export interface CreateAudienceRequest {
  Audiences: [
    {
      Name: string
      Type: 'CustomerList'
    }
  ]
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

export interface SyncAudiencePayload {
  CustomerListUserData: {
    ActionType: Action
    AudienceId: string
    CustomerListItemSubType: Identifier
    CustomerListItems: string[]
  }
}

export type Identifier = 'Email' | 'CRM'

export type Action = 'Add' | 'Remove'
