// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Identifier used to find existing Lead in Pipedrive. If not provided, will always create a new one.
   */
  identifier?: string
  /**
   * The name of the Lead (required for new Leads)
   */
  title?: string
  /**
   * Value of the Lead. If omitted, value will be set to 0.
   */
  value?: string
  /**
   * Currency of the Lead. Accepts a 3-character currency code. If omitted, currency will be set to the default currency of the authorized user.
   */
  currency?: string
  /**
   * Array of the IDs of the Lead Labels which will be associated with the Lead
   */
  label_ids?: {
    [k: string]: unknown
  }
  /**
   * The ID of the User which will be the owner of the created Lead. If not provided, the user making the request will be used.
   */
  owner_id?: number
  /**
   * The ID of the Person this Lead is associated with.
   */
  person_id?: number
  /**
   * The ID of the Organization this Lead is associated with.
   */
  org_id?: number
  /**
   * The expected close date of the Deal. In ISO 8601 format: YYYY-MM-DD.
   */
  expected_close_date?: string
  /**
   * Visibility of the deal. If omitted, visibility will be set to the default visibility setting of this item type for the authorized user. 1 -Owner & followers (private), 3	- Entire company (shared)
   */
  visible_to?: number
  /**
   * A flag indicating whether the Lead was seen by someone in the Pipedrive UI
   */
  was_seen?: boolean
}
