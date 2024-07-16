// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Details of the object to associate the record with
   */
  object_details: {
    /**
     * The type of Hubspot Object to add/update a record for.
     */
    from_object_type: string
    /**
     * The name of the ID field for the record.
     */
    from_id_field_name: string
    /**
     * The ID value for the record.
     */
    from_id_field_value: string
    /**
     * The canonical record ID for the record. This will be fetched from Hubspot and cannot be supplied by the end user.
     */
    from_hs_object_id?: string
  }
  /**
   * Properties to set on the record.
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * Associations to create between the record and other records.
   */
  associations?: {
    /**
     * The type of associated Hubspot Object.
     */
    to_object_type: string
    /**
     * The type of Association between the two records. The Association must already exist in Hubspot.
     */
    association_label: string
    /**
     * The name of the unique field Segment will use as an identifier when associating the record to another record. The unique field name must already exist on the Object in Hubspot.
     */
    to_id_field_name: string
    /**
     * The value of the identifier for the record to be associated with
     */
    to_id_field_value: string
    /**
     * The canonical record ID for the record. This will be fetched from Hubspot and cannot be supplied by the end user.
     */
    to_hs_object_id?: string
  }[]
  /**
   * Indicates if Segment should create new Properties fields on the associated object. Segment will infer the field types based on payload data. String, number and date types are supported. Other types will be converted to string.
   */
  createAssociatedObjectProperties: boolean
  /**
   * By default Segment batches events to Hubspot.
   */
  enable_batching?: boolean
  /**
   * Maximum number of events to include in each batch.
   */
  batch_size: number
}
