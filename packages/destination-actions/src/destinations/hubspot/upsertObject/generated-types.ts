// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Details of the object to associate the record with
   */
  object_details: {
    /**
     * The type of Hubspot Object to add/update a record for.
     */
    object_type: string
    /**
     * The name of the ID field for the record.
     */
    id_field_name: string
    /**
     * The ID value for the record.
     */
    id_field_value: string
    /**
     * Segment can new create properties on the object if needed. To enable this select the property group for Segment to add new properties to. To disable leave this field blank.
     */
    property_group?: string
  }
  /**
   * Properties to set on the record.
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * Sensitive Properties to set on the record.
   */
  sensitive_properties?: {
    [k: string]: unknown
  }
  /**
   * Specify if Segment create associated records in Hubspot. Records will only be created if the record requires a single identifier field and does not require property fields to be set upon creation.
   */
  association_sync_mode: string
  /**
   * Associations to create between the record and other records.
   */
  associations?: {
    /**
     * The type of associated Hubspot Object.
     */
    object_type: string
    /**
     * The type of Association between the two records. The Association must already exist in Hubspot.
     */
    association_label: string
    /**
     * The name of the unique field Segment will use as an identifier when associating the record to another record. The unique field name must already exist on the Object in Hubspot.
     */
    id_field_name: string
    /**
     * The value of the identifier for the record to be associated with
     */
    id_field_value?: string
  }[]
  /**
   * By default Segment batches events to Hubspot.
   */
  enable_batching?: boolean
  /**
   * Maximum number of events to include in each batch.
   */
  batch_size: number
}
