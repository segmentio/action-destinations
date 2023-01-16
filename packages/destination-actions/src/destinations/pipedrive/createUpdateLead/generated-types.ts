// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * ID of Lead in Pipedrive to Update. If left empty, a new one will be created
   */
  lead_id?: string
  /**
   * If present, used instead of field in settings to find existing person in Pipedrive.
   */
  person_match_field?: string
  /**
   * Value to find existing person by. Required unless organization_match_value present
   */
  person_match_value?: string
  /**
   * If present, used instead of field in settings to find existing organization in Pipedrive.
   */
  organization_match_field?: string
  /**
   * Value to find existing organization by. Required unless person_match_value present
   */
  organization_match_value?: string
  /**
   * The name of the Lead
   */
  title: string
  /**
   * Potential value of the lead
   */
  amount?: number
  /**
   * Three-letter code of the currency, e.g. USD
   */
  currency?: string
  /**
   * The date of when the Deal which will be created from the Lead is expected to be closed. In ISO 8601 format: YYYY-MM-DD.
   */
  expected_close_date?: string
  /**
   * Visibility of the Lead. If omitted, visibility will be set to the default visibility setting of this item type for the authorized user.
   */
  visible_to?: number
  /**
   * If the lead is created, use this timestamp as the creation timestamp. Format: YYY-MM-DD HH:MM:SS
   */
  add_time?: string | number
}
