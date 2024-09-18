// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Unique Audience Identifier returned by the createAudience() function call.
   */
  external_audience_id: string
  /**
   * Choose the type of identifier to use when adding users to Snapchat. If selecting Mobile ID or Phone, ensure these identifiers are included as custom traits in the Audience settings page where the destination is connected.
   */
  schema_type: string
  /**
   * Select the type of mobile identifier to use as External ID
   */
  mobile_id_type: string
  /**
   * Segment Audience Key
   */
  segment_audience_key: string
  /**
   * Segment Profile Traits or Properties
   */
  traits_or_props: {
    [k: string]: unknown
  }
  /**
   * User's email address
   */
  email?: string
}
