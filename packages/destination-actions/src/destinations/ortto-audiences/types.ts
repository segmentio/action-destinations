export const TEST_API_KEY = 'pau-key'
export interface Audience {
  id: string
  name: string
}
export interface AudienceList {
  audiences: Audience[]
  next_page: string
}

export interface BatchResponse {
  errors: {
    status: number
    message: string
    index: number
  }[]
}

export interface AudienceUpdateRequest {
  mode: 'add' | 'remove'
  id: string
}

export interface SyncAudienceRequest {
  message_id?: string
  user_id?: string
  anonymous_id?: string
  ip?: string | null
  location?: Object
  audience: AudienceUpdateRequest
  traits: {
    [k: string]: unknown
  }
}
