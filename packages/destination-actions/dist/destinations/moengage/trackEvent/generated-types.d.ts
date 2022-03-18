export interface Payload {
  type: string
  event: string
  user_id?: string
  anonymous_id?: string
  os_name?: string
  app_version?: string
  library_version?: string
  timestamp?: string | number
  properties?: {
    [k: string]: unknown
  }
}
