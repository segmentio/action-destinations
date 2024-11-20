// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * A list of mobile device IDs defining Customer Match audience members. The size of mobileDeviceIds mustn't be greater than 500,000.
   */
  mobileDeviceIds?: string
  /**
   * The ID of the DV360 Audience.
   */
  external_id?: string
  /**
   * The Advertiser ID associated with the DV360 Audience.
   */
  advertiser_id?: string
  /**
   * Enable batching of requests.
   */
  enable_batching: boolean
  /**
   * Maximum number of events to include in each batch. Actual batch sizes may be lower.
   */
  batch_size: number
}
