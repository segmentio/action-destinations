// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The company’s name.
   */
  name: string
  /**
   * City for the company’s address.
   */
  city?: string
  /**
   * State for the company’s address.
   */
  state?: string
  /**
   * Company’s domain name URL.
   */
  domain?: string
  /**
   * Phone number for the company
   */
  phone?: string
  /**
   * Industry to which the company belong from
   */
  industry?: string
  /**
   * Any other default or custom company properties. Custom properties must be predefined in HubSpot. More information in HubSpot documentation.
   */
  otherFields?: {
    [k: string]: unknown
  }
}
