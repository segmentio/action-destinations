export interface Payload {
  client_id: string
  user_id?: string
  search_term: string
  params?: {
    [k: string]: unknown
  }
}
