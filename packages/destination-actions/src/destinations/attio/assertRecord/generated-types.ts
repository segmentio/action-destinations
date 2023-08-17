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
   * Attributes to either set or update on the Attio Record. The keys on the left should be Attio Attribute IDs or Slugs, and the values on the right are Segment attributes or custom text. The Matching Attribute must be included for assertion to work.
   */
  attributes?: {
    name?: string
    [k: string]: unknown
  }
}
