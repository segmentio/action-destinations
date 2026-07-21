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

// A single error object inside a Bing Ads fault. AdApiFaultDetail nests these under `Errors`,
// ApiFaultDetail under `OperationErrors`. Both use the same PascalCase shape.
// Docs: https://learn.microsoft.com/en-us/advertising/guides/handle-service-errors-exceptions
export interface BingError {
  // All fields are optional: Bing's fault bodies are not guaranteed to include every field, and the
  // parsing code (parseBingFault) already treats them defensively. Keeping the type honest avoids
  // implying stronger guarantees than the runtime provides.
  Code?: number
  ErrorCode?: string
  Message?: string
  Detail?: string | null
}

// Whole-request fault body returned by Bing (as opposed to per-item PartialErrors). Every fault
// derives from ApplicationFault, so TrackingId is always present at the top level.
export interface BingFaultResponse {
  Errors?: BingError[]
  OperationErrors?: BingError[]
  TrackingId?: string
  Type?: string
}
