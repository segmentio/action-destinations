// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Anonymous id
   */
  anonymousId?: string
  /**
   * The ID associated with the user
   */
  userId?: string
  /**
   * The group id
   */
  groupId: string
  /**
   * The name of the account. Without providing a name, accounts are displayed using a numeric ID, making them harder to identify. (Highly Recommended)
   */
  name?: string
  /**
   * Helps calculate account tenure. If no createdAt is provided, the earliest createdAt from the associated users will be used. (Highly Recommended)
   */
  createdAt?: string
  /**
   * The overall status of your the account subscription. Possible options include: Free, Trial, Paid, Cancelled (Highly Recommended)
   */
  status?: string
  /**
   * The plan type helps in segmenting accounts by their subscription tier (e.g., starter, pro, enterprise). (Recommended)
   */
  plan?: string
  /**
   * Monthly recurring revenue (MRR) is important for segmenting accounts by value. It also allows Accoil to show the dollar value of different segments. Ideally this is passed in cents eg $99 becomes 9900. (Highly Recommended)
   */
  mrr?: number
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
