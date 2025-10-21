import { HTTPError } from '@segment/actions-core'
import { SEGMENT_TYPES } from './constants'

export type SegmentType = typeof SEGMENT_TYPES[keyof typeof SEGMENT_TYPES]

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
