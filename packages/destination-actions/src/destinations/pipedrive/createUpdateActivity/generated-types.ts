// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * If present, used instead of field in settings to find existing person in Pipedrive.
   */
  person_match_field?: string
  /**
   * Value to find existing person by
   */
  person_match_value: string
  /**
   * If present, used instead of field in settings to find existing organization in Pipedrive.
   */
  organization_match_field?: string
  /**
   * Value to find existing organization by
   */
  organization_match_value: string
  /**
   * If present, used instead of field in settings to find existing deal in Pipedrive.
   */
  deal_match_field?: string
  /**
   * Value to find existing deal by
   */
  deal_match_value: string
  /**
   * Subject of the Activity. When value for subject is not set, it will be given a default value `Call`.
   */
  subject?: string
  /**
   * Type of the Activity. This is in correlation with the key_string parameter of ActivityTypes. When value for type is not set, it will be given a default value `Call`
   */
  type?: string
  /**
   * Note of the Activity (HTML format)
   */
  note?: string
  /**
   * Due date of the Activity. Format: YYYY-MM-DD
   */
  due_date?: string
  /**
   * Due time of the Activity in UTC. Format: HH:MM
   */
  due_time?: string
  /**
   * Duration of the Activity. Format: HH:MM
   */
  duration?: string
  /**
   * Whether the Activity is done or not.
   */
  done?: boolean
}
