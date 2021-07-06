// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * ID of the campaign to trigger.
   */
  id: number
  /**
   * Custom Liquid merge data to include with the trigger.
   */
  data?: {
    [k: string]: unknown
  }
  /**
   * Additional recipient conditions to filter recipients. If this is used, "IDs" may not be used.
   */
  recipients?: {
    [k: string]: unknown
  }
  /**
   * List of profile IDs to use as campaign recipients. If this is used, "Recipients" may not be used.
   */
  ids?: string[]
}
