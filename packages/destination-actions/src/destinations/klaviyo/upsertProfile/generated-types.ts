// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Individual's email address. One of External ID, Phone Number and Email required.
   */
  email?: string
  /**
   * Individual's phone number in E.164 format. If SMS is not enabled and if you use Phone Number as identifier, then you have to provide one of Email or External ID.
   */
  phone_number?: string
  /**
   * A unique identifier used by customers to associate Klaviyo profiles with profiles in an external system.
   */
  external_id?: string
  /**
   * Individual's first name.
   */
  first_name?: string
  /**
   * Individual's last name.
   */
  last_name?: string
  /**
   * Name of the company or organization within the company for whom the individual works.
   */
  organization?: string
  /**
   * Individual's job title.
   */
  title?: string
  /**
   * URL pointing to the location of a profile image.
   */
  image?: string
  /**
   * Individual's address.
   */
  location?: {
    address1?: string | null
    address2?: string | null
    city?: string | null
    region?: string | null
    zip?: string | null
    latitude?: string | null
    longitude?: string | null
    country?: string | null
  }
  /**
   * An object containing key/value pairs for any custom properties assigned to this profile.
   */
  properties?: {
    [k: string]: unknown
  }
}
