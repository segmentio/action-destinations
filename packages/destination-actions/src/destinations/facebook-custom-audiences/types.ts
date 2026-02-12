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
  error: {
    message: string
    type: string
    code: number
  }
}
