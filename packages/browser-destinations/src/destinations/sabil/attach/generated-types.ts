// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The ID of the user
   */
  user_id: string
  /**
   * A key-value object that will be stored alongside the user, device and access records. This will be available to in any webhooks or API calls. Useful if you want to remote logout a device or invalidate a session from the backend via webhook.
   */
  metadata?: {
    [k: string]: unknown
  }
}
