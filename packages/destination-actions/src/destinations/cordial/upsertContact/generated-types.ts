// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Mapping to identify contact on Cordial side. Should be provided in form of cordialKey (path to the primary or secondary Cordial Contact key using dot notation) -> segmentValue. For example: channels.email.address -> userId or icfs.segmentId -> userId
   */
  userIdentities: {
    [k: string]: unknown
  }[]
  /**
   * Contact Attributes mapping (atrribute_name_in_cordial -> trait_name_in_segment). Complex attribute types to be mapped via dot notation, e.g. geo_attribute.street_address -> address.street
   */
  attributes?: {
    [k: string]: unknown
  }
}
