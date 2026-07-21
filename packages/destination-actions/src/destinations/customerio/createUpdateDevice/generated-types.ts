// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The ID of the person that this mobile device belongs to.
   */
  person_id: string
  /**
   * The device token of a customer's mobile device.
   */
  device_id: string
  /**
   * The version of the App
   */
  app_version?: string
  /**
   * The mobile device's platform. ("ios" or "android")
   */
  platform: string
  /**
   * The timestamp for when the mobile device was last used. Default is current date and time.
   */
  last_used?: string
  /**
   * Optional data that you can reference to segment your audience, like a person's attributes, but specific to a device.
   */
  attributes?: {
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
