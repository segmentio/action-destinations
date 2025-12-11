import { HTTPError } from '@segment/actions-core'
import { SEGMENT_TYPES, AUDIENCE_ACTION } from './constants'
import { Payload as UserPayload } from './updateAudience/generated-types'

export type SegmentType = typeof SEGMENT_TYPES[keyof typeof SEGMENT_TYPES]

export type AudienceAction = typeof AUDIENCE_ACTION[keyof typeof AUDIENCE_ACTION]

export type ValidUserPayload = (UserPayload & { index: number })

export interface AudienceJSON<E> {
  elements: E[]
}

export interface LinkedInUserAudienceElement {
  action: 'ADD' | 'REMOVE'
  userIds: LinkedInUserId[]
  firstName?: string
  lastName?: string
  title?: string
  company?: string
  country?: string
}

export type LinkedInUserId =
  | { idType: 'SHA256_EMAIL'; idValue: string }
  | { idType: 'GOOGLE_AID'; idValue: string }

export interface RefreshTokenResponse {
  access_token: string
  scope: string
  expires_in: number
  token_type: string
}

export interface ProfileAPIResponse {
  id: string
}

export interface AdAccountUserResponse {
  role: string
}

export interface GetDMPSegmentResponse {
  elements: Array<CreateDMPSegmentResponse>
}

export interface CreateDMPSegmentResponse {
  id: string
  type: 'USER' | 'COMPANY'
}

export interface LinkedInBatchUpdateResponse {
  elements: Array<
    {
      status: number,
      id?: string
      message?: string
    }>
}

export class LinkedInRefreshTokenError extends HTTPError {
  response: Response & {
    data: {
      error: string
      error_description: string
    }
  }
}

export class LinkedInTestAuthenticationError extends HTTPError {
  response: Response & {
    data: {
      message: string
    }
  }
}