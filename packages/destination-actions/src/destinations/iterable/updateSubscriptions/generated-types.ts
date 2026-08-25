// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * User identifier - provide email, userId, or both. At least one is required.
   */
  identifier: {
    /**
     * An email address that identifies a user profile in Iterable.
     */
    email?: string
    /**
     * A user ID that identifies a user profile in Iterable.
     */
    userId?: string
  }
  /**
   * When both email and userId are provided, this determines which identifier is sent to Iterable. Iterable requires one or the other, not both.
   */
  user_identifier_preference: string
  /**
   * Subscription changes to apply for this user. Maximum 6 items.
   */
  subscriptions: {
    /**
     * The type of subscription group.
     */
    subscription_group_type: string
    /**
     * The ID of the subscription group. Select a group type first to see available options.
     */
    subscription_group_id: string
    /**
     * Whether to subscribe or unsubscribe the user from this group.
     */
    action: string
  }[]
  /**
   * When enabled, Segment will send data to Iterable in batches.
   */
  enable_batching?: boolean
  /**
   * Maximum number of events to include in each batch. Actual batch sizes may be lower.
   */
  batch_size?: number
  /**
   * The keys to use for batching events together.
   */
  batch_keys?: string[]
}
