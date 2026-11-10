// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The ID used to uniquely identify a person in Customer.io. [Learn more](https://customer.io/docs/identifying-people/#identifiers).
   */
  id?: string
  /**
   * An optional anonymous ID, used to identify the person when no Person ID or email is provided. [Learn more](https://customer.io/docs/anonymous-events/).
   */
  anonymous_id?: string
  /**
   * The person's email address, used to identify the person when no Person ID is provided.
   */
  email?: string
  /**
   * Subscription preference per topic. Topic IDs come from your Subscription Center settings. Topics that are not included keep their current preference. [Learn more](https://docs.customer.io/messaging/channels/subscriptions/set-preferences-outside-center/).
   */
  topics?: {
    /**
     * The numeric ID of the topic, shown in the left column of your Subscription Center setup page. Enter the number only (for example `1`), not `topic_1`.
     */
    topic_id: number
    /**
     * `true` = subscribed, `false` = unsubscribed.
     */
    subscribed: boolean
  }[]
  /**
   * Subscription preference per channel. Channels that are not included keep their current preference.
   */
  channels?: {
    /**
     * The channel to update.
     */
    channel_type: string
    /**
     * `true` = subscribed, `false` = unsubscribed.
     */
    subscribed: boolean
  }[]
  /**
   * Sets the person's reserved `unsubscribed` attribute. `true` unsubscribes the person from all messages and clears their topic and channel preferences; `false` resubscribes them but does not restore cleared preferences, so send them again if needed. Leave empty to keep the current value.
   */
  unsubscribed?: boolean
  /**
   * A timestamp of when the preferences were changed. Default is current date and time. Used for ordering updates to the person.
   */
  timestamp?: string
  /**
   * Set as true to ensure Segment sends data to Customer.io in batches.
   */
  enable_batching?: boolean
  /**
   * Maximum number of events to include in each batch. Actual batch sizes may be lower.
   */
  batch_size?: number
}
