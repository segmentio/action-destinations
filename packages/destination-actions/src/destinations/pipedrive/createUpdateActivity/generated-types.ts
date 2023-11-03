// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * ID of Activity in Pipedrive to Update. If left empty, a new one will be created
   */
  activity_id?: number
  /**
   * If present, used instead of field in settings to find existing person in Pipedrive.
   */
  person_match_field?: string
  /**
   * Value to find existing person by
   */
  person_match_value?: string
  /**
   * If present, used instead of field in settings to find existing organization in Pipedrive.
   */
  organization_match_field?: string
  /**
   * Value to find existing organization by
   */
  organization_match_value?: string
  /**
   * If present, used instead of field in settings to find existing deal in Pipedrive.
   */
  deal_match_field?: string
  /**
   * Value to find existing deal by
   */
  deal_match_value?: string
  /**
   * Subject of the Activity. When value for subject is not set, it will be given a default value `Call`.
   */
  subject?: string
  /**
   * Type of the Activity. This is in correlation with the key_string parameter of ActivityTypes. When value for type is not set, it will be given a default value `Call`
   */
  type?: string
  /**
   * Additional details about the Activity that is synced to your external calendar. Unlike the note added to the Activity, the description is publicly visible to any guests added to the Activity.
   */
  description?: string
  /**
   * Note of the Activity (Accepts plain text and HTML)
   */
  note?: string
  /**
   * Due date of the Activity. Format: YYYY-MM-DD
   */
  due_date?: string
  /**
   * Due time of the Activity. Format: HH:MM
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
