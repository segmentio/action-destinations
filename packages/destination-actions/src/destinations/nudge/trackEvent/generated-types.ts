// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The name of the action being performed.
   */
  name: string
  /**
   * The ID of the user performing the action.
   */
  ext_id: string
  /**
   * The time at which the event occurred
   */
  occurred_at: string | number
  /**
   * Properties of the event
   */
  props?: {
    [k: string]: unknown
  }
}
