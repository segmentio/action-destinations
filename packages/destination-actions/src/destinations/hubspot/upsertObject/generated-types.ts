// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Specify whether to create, update or upsert a record.
   */
  recordCreation?: string
  /**
   * The type of Hubspot Object to create, update or upsert the record to.
   */
  objectType: string
  /**
   * Specify if Segment should create the 'Object Identifier Field' automatically on the Object if it does not already exist in Hubspot.
   */
  idCreation?: string
  /**
   * The unique field Segment will use as an identifier when creating, updating or upserting a record of 'Object Type'.
   */
  idField: string
  /**
   * Specify if Segment should create a Property automatically on the Object if it does not already exist in Hubspot.
   */
  propertyCreation?: string
  /**
   * String Properties to send to HubSpot.
   */
  stringProperties: {
    [k: string]: unknown
  }
  /**
   * Number Properties to send to HubSpot.
   */
  numericProperties: {
    [k: string]: unknown
  }
  /**
   * Boolean Properties to send to HubSpot.
   */
  booleanProperties: {
    [k: string]: unknown
  }
  /**
   * Datetime Properties to send to HubSpot.
   */
  dateProperties: {
    [k: string]: unknown
  }
  /**
   * The unique field Segment will use as an identifier when associating the record to another record.
   */
  toIdField: string
  /**
   * The type of Hubspot Object to associate the record to.
   */
  toObjectType?: string
  /**
   * The type of Association between the two records
   */
  associationLabel?: string
}
