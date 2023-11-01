// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The account to attach the device to.
   */
  account: string
  /**
   * The email of the user to attach the device to.
   */
  email?: string
  /**
   * The phone number of the user to attach the device to.
   */
  phone?: string
  /**
   * Metadata to attach to the device.
   */
  metadata?: {
    [k: string]: unknown
  }
  /**
   * Whether to include the page (url) in the attach request
   */
  include_page?: boolean
}
