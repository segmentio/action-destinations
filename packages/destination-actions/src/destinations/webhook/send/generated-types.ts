// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * User email address
   */
  email: string
  /**
   * Audience name
   */
  audience_name: string
  /**
   * Maximum number of events to include in each batch. Actual batch sizes may be lower.
   */
  batch_size?: number
  /**
   * HTTP headers to send with each request.
   */
  traits_or_properties: string
}
