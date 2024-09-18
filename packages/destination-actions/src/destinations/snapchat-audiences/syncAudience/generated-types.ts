// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Unique Audience Identifier returned by the createAudience() function call.
   */
  external_audience_id: string
  /**
   * Choose the type of identifier to use when adding users to Snapchat. If selecting Mobile ID or Phone, ensure these identifiers are included as custom traits in the Audience settings page where the destination is connected.
   */
  schema_type?: string & string[]
  /**
   * The identifier used for the profile’s mobile ID. If left empty, Segment will automatically search the payload for either an iOS or Android ID and use the first one it finds.
   */
  mobile_id?: string
  /**
   * Segment Audience Key
   */
  segment_audience_key: string
  /**
   * Traits object
   */
  traits: {
    [k: string]: unknown
  }
  /**
   * User's email address
   */
  email?: string
}
