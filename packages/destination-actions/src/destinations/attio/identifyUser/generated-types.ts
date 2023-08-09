// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The email address of the person to link the user to
   */
  email_address: string
  /**
   * Additional attributes to either set or update on the Attio User Record. The keys on the left should be Attio Attribute IDs or Slugs, and the values on the right are Segment attributes or custom text.
   */
  user_attributes?: {
    name?: string
    [k: string]: unknown
  }
  /**
   * Additional attributes to either set or update on the Attio Person Record. The keys on the left should be Attio Attribute IDs or Slugs, and the values on the right are Segment attributes or custom text.
   */
  person_attributes?: {
    [k: string]: unknown
  }
}
