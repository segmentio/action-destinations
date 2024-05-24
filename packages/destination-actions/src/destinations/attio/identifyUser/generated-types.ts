// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The email address of the person to link the user to
   */
  email_address: string
  /**
   * The ID of the User
   */
  user_id: string
  /**
   * Additional attributes to either set or update on the Attio User Record. The values on the left should be Segment attributes or custom text, and the values on the right are Attio Attribute IDs or Slugs. For example: traits.name → name
   */
  user_attributes?: {
    [k: string]: unknown
  }
  /**
   * Additional attributes to either set or update on the Attio Person Record. The values on the left should be Segment attributes or custom text, and the values on the right are Attio Attribute IDs or Slugs. For example: traits.name → name
   */
  person_attributes?: {
    [k: string]: unknown
  }
  /**
   * Send data to Attio in batches for much better performance.
   */
  enable_batching?: boolean
  /**
   * Max batch size to send to Attio (limit is 10,000)
   */
  batch_size?: number
  /**
   * When the event was received.
   */
  received_at: string | number
}
