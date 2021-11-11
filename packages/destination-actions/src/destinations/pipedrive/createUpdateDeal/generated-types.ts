// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Identifier used to find existing activity in Pipedrive. If not provided, will always create a new one.
   */
  identifier?: number
  /**
   * Deal title
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
   * The ID of the User which will be the owner of the created Deal. If not provided, the user making the request will be used.
   */
  user_id?: number
  /**
   * The ID of the Person this Activity is associated with.
   */
  person_id?: number
  /**
   * The ID of the Organization this Activity is associated with.
   */
  org_id?: number
  /**
   * The ID of a stage this Deal will be placed in a pipeline (note that you can't supply the ID of the pipeline as this will be assigned automatically based on stage_id). If omitted, the deal will be placed in the first stage of the default pipeline.
   */
  stage_id?: string
  /**
   * Deal status. If omitted, status will be set to open.
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
  lost_reason?: number
  /**
   * Visibility of the deal. If omitted, visibility will be set to the default visibility setting of this item type for the authorized user. 1 -Owner & followers (private), 3	- Entire company (shared)
   */
  visible_to?: number
  /**
   * If the person is created, use this timestamp as the creation timestamp. Format: YYY-MM-DD HH:MM:SS
   */
  add_time?: string
}
