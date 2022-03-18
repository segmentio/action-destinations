export interface Payload {
  type: string
  user_id?: string | null
  anonymous_id?: string | null
  os_name?: string
  app_version?: string
  library_version?: string
  timestamp?: string | number
  traits?: {
    [k: string]: unknown
  }
}
