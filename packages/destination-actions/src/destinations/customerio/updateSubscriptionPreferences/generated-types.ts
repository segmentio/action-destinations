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
   * An object mapping subscription topic IDs to `true` (subscribed) or `false` (unsubscribed), for example `{"topic_1": true, "topic_2": false}`. Keys are topic IDs from your Subscription Center settings, written as `topic_<id>`; bare numeric IDs like `"1"` are converted to `topic_1`. Topics that are not included keep their current preference. [Learn more](https://docs.customer.io/messaging/channels/subscriptions/set-preferences-outside-center/).
   */
  topics?: {
    [k: string]: unknown
  }
  /**
   * An object mapping channel types (`email`, `sms`, `push`, `in_app`, `whatsapp`, `slack`, `line`, `inbox`) to `true` (subscribed) or `false` (unsubscribed), for example `{"sms": false}`. Channels that are not included keep their current preference.
   */
  channels?: {
    [k: string]: unknown
  }
  /**
   * Sets the person's reserved `unsubscribed` attribute. `true` unsubscribes the person from all messages; `false` resubscribes them. Leave empty to keep the current value.
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
