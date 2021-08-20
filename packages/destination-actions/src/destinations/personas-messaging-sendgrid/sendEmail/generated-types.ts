// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * User ID in Segment
   */
  userId?: string | null
  /**
   * From Email
   */
  from: string
  /**
   * From Name displayed to end user email
   */
  fromName: string
  /**
   * The Email Address to send an email to
   */
  email: string
  /**
   * The Name of the user to send an email
   */
  firstName: string
  /**
   * The message body
   */
  body: string
  /**
   * Subject for the email to be sent
   */
  subject: string
  /**
   * Your Profile API Space ID
   */
  spaceId?: string
  /**
   * The ID of your Source
   */
  sourceId?: string
  /**
   * The Profile/Traits Properties
   */
  profile: {
    [k: string]: unknown
  }
}
