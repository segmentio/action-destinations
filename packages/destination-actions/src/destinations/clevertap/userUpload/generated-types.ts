// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * A timestamp when the person was created
   */
  ts?: string
  /**
   * Optional attributes for the person. When updating a person attributes added or updated, not removed
   */
  profileData?: {
    [k: string]: unknown
  }
  /**
   * The Id used to uniquely identify a person in CleverTap
   */
  identity: string
}
