// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Segment User ID value
   */
  segmentId?: string
  /**
   * Please define the system name of Segment Anonymousd ID contact attribute in Cordial (e.g. segment_anonymous_id)
   */
  anonymousId?: string
  /**
   * An ordered list of contact identifiers in Cordial. Each item in the list represents an identifier. For example, `channels.email.address -> userId` and/or `customerId -> traits.customerId`. If a contact is found using the identifiers it is updated, otherwise a new contact is created.
   */
  userIdentities?: {
    [k: string]: unknown
  }
  /**
   * Segment group id. Required.
   */
  groupId: string
}
