import type { Payload as AddToAudiencePayload } from './addToAudience/generated-types'
import type { Payload as RemoveFromAudiencePayload } from './removeFromAudience/generated-types'

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

export type BasicListTypeMap = {
  basicUserList: any
  [key: string]: any
}

export type UserOperation = {
  UserId: string
  UserIdType: number
  UserListId: number
  Delete: boolean
}

export type ListOperation = 'add' | 'remove'
export type UpdateHandlerPayload = AddToAudiencePayload & RemoveFromAudiencePayload

export interface DataManagerErrorResponse {
  error: {
    code?: number
    message?: string
    status?: string
  }
}

export interface DataManagerUserList {
  name: string
  id: string
  displayName?: string
  membershipStatus?: string
}
