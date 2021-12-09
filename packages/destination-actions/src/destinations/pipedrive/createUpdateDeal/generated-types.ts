// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * If present, used instead of field in settings to find existing deal in Pipedrive.
   */
  deal_match_field?: string
  /**
   * Value to find existing deal by
   */
  deal_match_value?: string
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
   * Deal title  (required for new Leads)
   */
  title: string
  /**
   * Value of the deal. If omitted, value will be set to 0.
   */
  value?: string
  /**
   * Currency of the deal. Accepts a 3-character currency code. If omitted, currency will be set to the default currency of the authorized user.
   */
  currency?: string
  /**
   * The ID of a stage this Deal will be placed in a pipeline (note that you can't supply the ID of the pipeline as this will be assigned automatically based on stage_id). If omitted, the deal will be placed in the first stage of the default pipeline.
   */
  stage_id?: number
  /**
   * Deal status - open, won, lost or deleted. If omitted, status will be set to open.
   */
  status?: string
  /**
   * The expected close date of the Deal. In ISO 8601 format: YYYY-MM-DD.
   */
  expected_close_date?: string
  /**
   * Deal success probability percentage. Used/shown only when deal_probability for the pipeline of the deal is enabled.
   */
  probability?: number
  /**
   * Optional message about why the deal was lost (to be used when status=lost)
   */
  lost_reason?: string
  /**
   * Visibility of the deal. If omitted, visibility will be set to the default visibility setting of this item type for the authorized user. 1 -Owner & followers (private), 3	- Entire company (shared)
   */
  visible_to?: number
  /**
   * If the deal is created, use this timestamp as the creation timestamp. Format: YYY-MM-DD HH:MM:SS
   */
  add_time?: string | number
  /**
   * New values for custom fields.
   */
  custom_fields?: {
    [k: string]: unknown
  }
}
