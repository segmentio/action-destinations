export interface APIResponse {
  code: number
  message: string
  request_id: string
}

export interface GetAudienceAPIResponse extends APIResponse {
  data: {
    page_info: {
      page: number
      total_page: number
      total_number: number
      page_size: number
    }
    list: [Audiences]
  }
}
export interface CreateAudienceAPIResponse extends APIResponse {
  data: {
    audience_id: string
  }
}

export interface Audiences {
  is_expiring: boolean
  cover_num: number
  name: string
  audience_id: string
  audience_type: string
  is_valid: boolean
  create_time: string
  shared: boolean
  expired_time: string
  calculate_type: string
}

export interface AudienceInfoError {
  code: number
  message: string
}
