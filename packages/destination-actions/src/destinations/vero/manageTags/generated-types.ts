// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The unique identifier of the user in Vero.
   */
  userId: string
  /**
   * Tags to add to the user.
   */
  tagsToAdd?: string[]
  /**
   * Tags to remove from the user.
   */
  tagsToRemove?: string[]
  /**
   * Tag name for the audience. Added when the user enters the audience, removed when they leave. Defaults to the Engage audience key. Required for Reverse ETL, where no key is sent.
   */
  audienceKey?: string
}
