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
        type: string
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
