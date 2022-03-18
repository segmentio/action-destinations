export interface Payload {
  clientId: string
  user_id?: string
  name: string
  lowercase?: boolean
  params?: {
    [k: string]: unknown
  }
}
