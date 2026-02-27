import { ErrorCodes } from '@segment/actions-core'

export interface CreateAudienceRequest {
  name: string
  subtype: 'CUSTOM'
  description?: string
  customer_file_source: 'BOTH_USER_AND_PARTNER_PROVIDED'
}

export interface CreateAudienceResponse {
  id: string
}

export interface GetAudienceResponse {
  id: string
  name?: string
}

export interface FacebookResponseError {
  response: {
    status?: number
    data: {
      error: {
        message: string
        type: keyof typeof ErrorCodes | string
        code: number
        error_subcode?: number
        fbtrace_id?: string
        error_user_title?: string
        error_user_msg?: string
      }
    }
  },
  message?: string
}

export interface NonFacebookError { 
  message: string 
  code: keyof typeof ErrorCodes
}

export interface ParsedFacebookError {
  message: string
  code: keyof typeof ErrorCodes | string
  status: number
}