// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  lead_name?: string
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  contact_url?: string
  contact_title?: string
  /**
   * Your ID that identifies the Contact. Contact Custom Field ID for User ID must be defined in the global integration settings.
   */
  contact_external_id?: string
  /**
   * Custom Fields to set on the Contact. Key should be Custom Field ID (`cf_xxxx`).
   */
  contact_custom_fields?: {
    [k: string]: unknown
  }
}
