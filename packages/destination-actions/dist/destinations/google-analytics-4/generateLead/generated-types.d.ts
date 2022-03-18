export interface Payload {
  client_id: string
  user_id?: string
  currency?: string
  value?: number
  params?: {
    [k: string]: unknown
  }
}
