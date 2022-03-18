export interface Payload {
  client_id: string
  user_id?: string
  method?: string
  params?: {
    [k: string]: unknown
  }
}
