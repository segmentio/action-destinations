// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The user's email address.
   */
  email: string
  /**
   * The user's full name.
   */
  fullName?: string
  /**
   * The user's first name.
   */
  firstName?: string
  /**
   * The user's last name.
   */
  lastName?: string
  /**
   * A comment to post to the RevUser. If empty, no comment will be posted on the RevUser, otherwise the comment will be posted to the RevUser. The comment will be posted even if the RevUser already exists on the RevDev platform
   */
  comment?: string
  /**
   * A tag to apply to created Accounts.
   */
  tag?: string
}
