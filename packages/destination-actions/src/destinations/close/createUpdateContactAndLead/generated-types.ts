// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The name of the Lead.
   */
  lead_name?: string
  /**
   * Your ID that identifies the Lead. Lead Custom Field ID for Company must be defined in the global integration settings.
   */
  lead_external_id?: string
  /**
   * Description of the Lead
   */
  lead_description?: string
  /**
   * ID of the Lead Status (`stat_xxxx`). You can get it in Close in Statuses & Pipelines page.
   */
  lead_status_id?: string
  /**
   * Custom Fields to set on the Lead. Key should be Custom Field ID (`cf_xxxx`).
   */
  lead_custom_fields?: {
    [k: string]: unknown
  }
  /**
   * The name of the Contact.
   */
  contact_name?: string
  /**
   * Can be used for looking up the Contact. If the Contact already has different email address, this value will be appended.
   */
  contact_email?: string
  /**
   * If the Contact already has different phone number, this value will be appended.
   */
  contact_phone?: string
  /**
   * If the Contact already has different URL, this value will be appended.
   */
  contact_url?: string
  /**
   * The title of the Contact.
   */
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
