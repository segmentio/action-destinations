// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Specify if Segment should create a new Object Type automatically on HubSpot if it does not already exist.
   */
  createObject: boolean
  /**
   * Specify if Segment should create new Properties automatically on HubSpot if they do not already exist.
   */
  createProperties: boolean
  /**
   * Specify if Segment should create a new Identifier 'Unique Field' automatically on HubSpot if it does not already exist.
   */
  createIdentifier: boolean
  /**
   * The type of Hubspot Object to create, update or upsert the record to.
   */
  objectType: string
  /**
   * Specify if Segment should create, update or upsert a record.
   */
  insertType: string
  /**
   * The name of the unique field Segment will use as an identifier when creating, updating or upserting a record of 'Object Type'.
   */
  idFieldName: string
  /**
   * The type of Association between the two records. The Association must already exist in Hubspot.
   */
  associationLabel?: string
  /**
   * The value of the identifier to send to Hubspot.
   */
  idFieldValue: string
  /**
   * String Properties to send to HubSpot.
   */
  stringProperties?: {
    [k: string]: unknown
  }
  /**
   * Number Properties to send to HubSpot.
   */
  numericProperties?: {
    [k: string]: unknown
  }
  /**
   * Boolean Properties to send to HubSpot.
   */
  booleanProperties?: {
    [k: string]: unknown
  }
  /**
   * Datetime Properties to send to HubSpot.
   */
  dateProperties?: {
    [k: string]: unknown
  }
  /**
   * The name of the unique field Segment will use as an identifier when associating the record to another record. The unique field name must already exist on the Object in Hubspot.
   */
  toIdFieldName?: string
  /**
   * The value of the identifier for the record to be associated with
   */
  toIdFieldValue?: string
  /**
   * The type of Hubspot Object to associate the record to. This Object Type must already exist in Hubspot.
   */
  toObjectType?: string
  /**
   * Hubspot internal unique identifier for the Record.
   */
  recordID?: string
  /**
   * Hubspot internal unique identifier for the To Record.
   */
  toRecordID?: string
  /**
   * By default Segment batches events to Hubspot.
   */
  enable_batching?: boolean
  /**
   * Maximum number of events to include in each batch.
   */
  batch_size: number
}
