// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Identifier used to find existing activity in Pipedrive. If not provided, will always create a new one.
   */
  identifier?: number
  /**
   * Type of the Activity. This is in correlation with the key_string parameter of ActivityTypes. When value for type is not set, it will be given a default value `Call`
   */
  type?: string
  /**
   * Subject of the Activity. When value for subject is not set, it will be given a default value `Call`.
   */
  subject?: string
  /**
   * Note of the Activity (HTML format)
   */
  note?: string
  /**
   * The ID of the Deal this Activity is associated with.
   */
  deal_id?: number
  /**
   * The ID of the Person this Activity is associated with.
   */
  person_id?: number
  /**
   * The ID of the Organization this Activity is associated with.
   */
  org_id?: number
  /**
   * Due date of the Activity. Format: YYYY-MM-DD
   */
  due_date?: string
  /**
   * Due time of the Activity in UTC. Format: HH:MM
   */
  due_time?: string
  /**
   * Whether the Activity is done or not. 0 = Not done, 1 = Done
   */
  done?: number
}
