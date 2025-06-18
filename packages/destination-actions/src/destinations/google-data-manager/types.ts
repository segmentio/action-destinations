import type { Payload as AddToAudiencePayload } from './ingest/generated-types'

export interface RefreshTokenResponse {
  access_token: string
}

export interface GoogleAPIError {
  response: {
    status: number
    data: {
      error: {
        message: string
      }
    }
  }
}

export type UserOperation = {
  UserId: string
  UserIdType: number
  UserListId: number
  Delete: boolean
}

export type ListOperation = 'add' | 'remove'
export type UpdateHandlerPayload = AddToAudiencePayload
