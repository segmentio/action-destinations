// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Identifier used to locate the list. Find this under Help & Support > API ID Information in https://admin.listrak.com.
   */
  listId: number
  /**
   * Email address of the contact.
   */
  emailAddress: string
  /**
   * Add one or more profile field IDs as object keys. You can find these IDs under Help & Support > API ID Information on https://admin.listrak.com. Choose one of three options as the object value: "on" (activates this field in Listrak), "off" (deactivates this field in Listrak), or "useAudienceKey" (Listrak sets the field based on the Segment Audience payload's audience_key: "true" activates the field, "false" deactivates it).
   */
  profileFieldValues: {
    [k: string]: unknown
  }
  /**
   * The properties object
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * The key that determines if the contact is in the audience or not.
   */
  audience_key?: string
  /**
   * When enabled, multiple events will be sent to Listrak in a single request, which is recommended for optimal performance.
   */
  enable_batching: boolean
}
