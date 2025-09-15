// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The ID associated with the user
   */
  userId: string
  /**
   * Email addresses are highly recommended as they are often used to identify users across multiple platforms. (Highly Recommended)
   */
  email?: string
  /**
   * Providing a name helps display users in Accoil. If no name is provided, the email address is displayed instead. (Highly Recommended)
   */
  name?: string
  /**
   * Describes the user's role in your product such as Admin, Owner, Team Member. (Suggested)
   */
  role?: string
  /**
   * Capturing the account status on the user can be helpful to segment users. Possible options include: Free, Trial, Paid, Cancelled (Suggested)
   */
  accountStatus?: string
  /**
   * When was the user created, including this ensures that tenure tracking is accurate. (Highly Recommended)
   */
  createdAt?: string
  /**
   * Optionally send all traits to associate with the user or the group
   */
  traits?: {
    [k: string]: unknown
  }
  /**
   * The timestamp of the event
   */
  timestamp: string
}
