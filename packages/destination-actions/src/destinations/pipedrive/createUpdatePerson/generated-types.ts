// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * If present, used instead of field in settings to find existing person in Pipedrive.
   */
  match_field?: string
  /**
   * Value to find existing person by
   */
  match_value: string
  /**
   * Name of the person
   */
  name?: string
  /**
   * Email addresses for this person.
   */
  email?: string[]
  /**
   * Phone numbers for the person.
   */
  phone?: string[]
  /**
   * Visibility of the Person. If omitted, visibility will be set to the default visibility setting of this item type for the authorized user.
   */
  visible_to?: number
  /**
   * If the person is created, use this timestamp as the creation timestamp. Format: YYY-MM-DD HH:MM:SS
   */
  add_time?: string | number
  /**
   * New values for custom fields.
   */
  custom_fields?: {
    [k: string]: unknown
  }
}
