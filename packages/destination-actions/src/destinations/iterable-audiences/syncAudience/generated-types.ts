// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Email address of the user
   */
  email?: string
  /**
   * User ID
   */
  userId?: string
  /**
   * Additional traits or identifiers to sync to Iterable. You will need to ensure these traits or objects are included via Event Settings > Customized Setup.
   */
  dataFields?: {
    [k: string]: unknown
  }
  /**
   * Traits or Properties object from the identify() or track() call emitted by Engage
   */
  traitsOrProperties: {
    [k: string]: unknown
  }
  /**
   * Segment Audience Key. Maps to the Iterable List "Name" when the list is created in Iterable.
   */
  segmentAudienceKey: string
  /**
   * Segment External Audience ID. Maps to the List ID when the list is created in Iterable.
   */
  segmentAudienceId: string
}
