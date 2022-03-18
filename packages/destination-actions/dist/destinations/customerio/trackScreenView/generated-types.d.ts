export interface Payload {
  id?: string
  anonymous_id?: string
  name: string
  timestamp?: string
  data?: {
    [k: string]: unknown
  }
  convert_timestamp?: boolean
}
