export interface Payload {
  lead_name?: string
  lead_external_id?: string
  lead_description?: string
  lead_status_id?: string
  lead_custom_fields?: {
    [k: string]: unknown
  }
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  contact_url?: string
  contact_title?: string
  contact_external_id?: string
  contact_custom_fields?: {
    [k: string]: unknown
  }
}
