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
