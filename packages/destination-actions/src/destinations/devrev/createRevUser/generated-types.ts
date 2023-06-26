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
   * A comment to post to the RevUser.  If blank, no comment will be posted on the RevUser.  This will be posted both if the RevUser is created and if the RevUser is not created
   */
  comment?: string
  /**
   * A tag to apply to created Accounts.
   */
  tag?: string
}
