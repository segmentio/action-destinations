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
   * Comma delimited list containing names of additional traits or identifiers to sync to Iterable. You will need to ensure these traits or obects are included via Event Settings >> Customized Setup.
   */
  dataFields?: string
  /**
   * Traits or Properties object from the identify() or track() call emitted by Engage
   */
  traitsOrProperties: {
    [k: string]: unknown
  }
  /**
   * Segment Audience Key. Maps to the "Name" of the Segment node in Yahoo taxonomy
   */
  segmentAudienceKey: string
  /**
   * Segment External Audience ID. Maps to the List ID when the list is created in Iterable.
   */
  segmentAudienceId: string
}
