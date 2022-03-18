export interface Payload {
  id: string
  anonymous_id?: string
  email?: string
  created_at?: string
  custom_attributes?: {
    [k: string]: unknown
  }
  convert_timestamp?: boolean
}
