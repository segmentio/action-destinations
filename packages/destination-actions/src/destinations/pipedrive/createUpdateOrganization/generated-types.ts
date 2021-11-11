// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * If present, used instead of field in settings to find existing organization in Pipedrive.
   */
  match_field?: string
  /**
   * Value to find existing organization by
   */
  match_value: string
  /**
   * Name of the organization
   */
  name?: string
  /**
   * If the organization is created, use this timestamp as the creation timestamp. Format: YYY-MM-DD HH:MM:SS
   */
  add_time?: string
}
