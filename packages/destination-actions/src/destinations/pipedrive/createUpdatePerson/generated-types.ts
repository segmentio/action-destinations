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
  name: string
  /**
   * ID of the organization this person will belong to.
   */
  org_id?: number
  /**
   * Email addresses for this person.
   */
  email?: string[]
  /**
   * Phone number for the person.
   */
  phone?: string
  /**
   * If the person is created, use this timestamp as the creation timestamp. Format: YYY-MM-DD HH:MM:SS
   */
  add_time?: string
}
