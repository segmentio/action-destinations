// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Segment User ID value
   */
  segmentId?: string
  /**
   * Segment Anonymous ID value
   */
  anonymousId?: string
  /**
   * An ordered list of contact identifiers in Cordial. Each item in the list represents an identifier. For example, `channels.email.address -> userId` and/or `customerId -> traits.customerId`. If a contact is found using the identifiers it is updated, otherwise a new contact is created.
   */
  userIdentities?: {
    [k: string]: unknown
  }
  /**
   * Event name. Required.
   */
  action: string
  /**
   * Event timestamp. Optional. Date format is ISO 8601 standard. If empty, the request upload time will be used.
   */
  time?: string | number
  /**
   * An object of additional event attributes. Optional.
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * Event context as it appears in Segment. Optional. We use context to capture event metadata like sender ip and device info.
   */
  context?: {
    [k: string]: unknown
  }
}
