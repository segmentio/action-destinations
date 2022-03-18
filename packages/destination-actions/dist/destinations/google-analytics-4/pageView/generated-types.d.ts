export interface Payload {
  clientId: string
  user_id?: string
  page_location?: string
  page_referrer?: string
  params?: {
    [k: string]: unknown
  }
}
