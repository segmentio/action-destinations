export interface Payload {
  id?: string
  anonymous_id?: string
  url: string
  timestamp?: string
  data?: {
    [k: string]: unknown
  }
  convert_timestamp?: boolean
}
