// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The contact’s email. Email is used to uniquely identify contact records in HubSpot and create or update the contact accordingly.
   */
  email: string
  /**
   * A custom external ID that identifies the visitor.
   */
  id?: string
  /**
   * A list of key-value pairs that describe the contact. Please see [HubSpot`s documentation](https://knowledge.hubspot.com/account/prevent-contact-properties-update-through-tracking-code-api) for limitations in updating contact properties.
   */
  custom_properties?: {
    [k: string]: unknown
  }
  /**
   * The name of the company the contact is associated with.
   */
  company?: string
  /**
   * The name of the country the contact is associated with.
   */
  country?: string
  /**
   * The name of the state the contact is associated with.
   */
  state?: string
  /**
   * The name of the city the contact is associated with.
   */
  city?: string
  /**
   * The street address of the contact.
   */
  address?: string
  /**
   * The postal code of the contact.
   */
  zip?: string
}
