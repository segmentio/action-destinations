export interface Payload {
  ope_user_id: string
  ope_event_type: string
  ope_alt_user_ids?: string[]
  ope_item_uri?: string
  ope_app_version?: string
  ope_event_time_ms?: string
  ope_user_agent?: string
  gdpr?: number
  gdpr_consent?: string
  ope_usp_string?: string
  platform?: string
  custom_fields?: {
    [k: string]: unknown
  }
}
