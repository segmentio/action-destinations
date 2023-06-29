// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The ID of the part to create work for.
   */
  partId: string
  /**
   * The title of the work to create.
   */
  title: string
  /**
   * The description of the work to create.
   */
  description: string
  /**
   * User email address, will be added to the description
   */
  email?: string
  /**
   * The user ID of the user to assign the work to.
   */
  assignTo: string
  /**
   * The priority of the work to create.
   */
  priority: string
  /**
   * The type of the work to create.
   */
  type: string
}
