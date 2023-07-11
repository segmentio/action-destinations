// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * A user’s unique visitor ID. Setting an Mbox 3rd Party ID allows for updates via the Adobe Target Cloud Mode Destination. For more information, please see our Adobe Target Destination documentation.
   */
  userId?: string
  /**
   * Profile parameters specific to a user. Please note, Adobe recommends that PII is hashed prior to sending to Adobe.
   */
  traits?: {
    [k: string]: unknown
  }
}
