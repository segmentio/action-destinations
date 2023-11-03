// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Segment User ID value
   */
  segmentId?: string
  /**
   * Segment Anonymous ID value
   */
  anonymousId?: string
  /**
   * An ordered list of contact identifiers in Cordial. Each item in the list represents an identifier. For example, `channels.email.address -> userId` and/or `customerId -> traits.customerId`. If a contact is found using the identifiers it is updated, otherwise a new contact is created.
   */
  userIdentities?: {
    [k: string]: unknown
  }
  /**
   * Contact attributes to update. Optional. Contact attributes must exist in Cordial prior to updating. Attributes that do not exist in Cordial will be ignored. Complex attribute types to be mapped via dot notation, for example, `cordialPerson.first_name -> traits.segmentPerson.firstName`, `cordialPerson.last_name -> traits.segmentPerson.lastName`. Segment trait address can be mapped directly to geo Cordial attribute: `geo_cordial_attribute -> traits.address`.
   */
  attributes?: {
    [k: string]: unknown
  }
}
