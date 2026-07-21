// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The ID used to uniquely identify a person in Customer.io. [Learn more](https://customer.io/docs/identifying-people/#identifiers).
   */
  id?: string
  /**
   * An anonymous ID for when no Person ID exists. [Learn more](https://customer.io/docs/anonymous-events/).
   */
  anonymous_id?: string
  /**
   * The name of the event.
   */
  name: string
  /**
   * An optional identifier used to deduplicate events. [Learn more](https://customer.io/docs/api/#operation/track).
   */
  event_id?: string
  /**
   * A timestamp of when the event took place. Default is current date and time.
   */
  timestamp?: string
  /**
   * Optional data to include with the event.
   */
  data?: {
    [k: string]: unknown
  }
  /**
   * Convert dates to Unix timestamps (seconds since Epoch).
   */
  convert_timestamp?: boolean
  /**
   * Set as true to ensure Segment sends data to Customer.io in batches.
   */
  enable_batching?: boolean
  /**
   * Maximum number of events to include in each batch. Actual batch sizes may be lower.
   */
  batch_size?: number
}
