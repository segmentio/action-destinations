// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The type of Attio Object you'd like to create or update ('assert')
   */
  object: string
  /**
   * The Attribute (ID or slug) on the Attio Object above, that uniquely identifies a Record (and is marked as unique in Attio). Events containing the same value for this attribute will update the original Record, rather than creating a new one. For example, to create or update a Person you might use the Attio attribute `email_addresses` here.
   */
  matching_attribute: string
  /**
   * Attributes to either set or update on the Attio Record. The values on the left should be Segment attributes or custom text, and the values on the right are Attio Attribute IDs or Slugs, for example: traits.name → name. The Matching Attribute must be included for assertion to work.
   */
  attributes?: {
    [k: string]: unknown
  }
  /**
   * Events will be sent Attio in batches. When batching is enabled any invalid events will be silently dropped.
   */
  enable_batching?: boolean
  /**
   * Max batch size to send to Attio (limit is 10,000)
   */
  batch_size?: number
  /**
   * When the event was received.
   */
  received_at?: string | number
}
