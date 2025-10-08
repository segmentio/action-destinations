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
     * The Association label to apply between the two records. The Association label must already exist in Hubspot.
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
   * Remove Association Labels from an Association between two records. Removing the default association label will dissociate both records from each other completely. This feature is currently in Beta and should not be used with production data.
   */
  dissociations?: {
    /**
     * The type of associated Hubspot Object.
     */
    object_type: string
    /**
     * The Association label to remove between the two records. The Association label must already exist in Hubspot. Removing the default Association label will delete the entire Association between the two records.
     */
    association_label: string
    /**
     * The name of the unique field Segment will use as an identifier when disassociating the record from another record. The unique field name must already exist on the Object in Hubspot.
     */
    id_field_name: string
    /**
     * The value of the identifier for the record to be disassociated with
     */
    id_field_value?: string
  }[]
  /**
   * Details of the list to add or remove the record from. This feature is currently in Beta and should not be used with production data.
   */
  list_details?: {
    /**
     * Set to true if syncing an Engage Audience to a Hubspot list, false otherwise.
     */
    connected_to_engage_audience?: boolean
    /**
     * The name of the Hubspot List to add or remove the record from. If connecting to an Engage Audience this field can be left empty.
     */
    list_name?: string
    /**
     * Specify if the record should be added or removed from the list. true = add to list, false = remove from list. If connecting an Engage Audience this field must be left empty.
     */
    list_action?: boolean
    /**
     * If true, Segment will create the list in Hubspot if it does not already exist.
     */
    should_create_list?: boolean
  }
  /**
   * By default Segment batches events to Hubspot.
   */
  enable_batching?: boolean
  /**
   * Maximum number of events to include in each batch.
   */
  batch_size: number
  /**
   * The keys to use for batching the events.
   */
  batch_keys?: string[]
  /**
   * The time the event occurred. This will be used to de-duplicate the events before sending them to hubspot.
   */
  timestamp?: string
  /**
   * Hidden field: Object which to get the traits or properties object from Engage Audience payloads.
   */
  traits_or_props?: {
    [k: string]: unknown
  }
  /**
   * Hidden field: Engage Audience Computation Key refers to the audience slug name in an Engage Audience payload.
   */
  computation_key?: string
  /**
   * Hidden field: Engage Audience Computation Class indicates if the payload is from an Engage Audience or not.
   */
  computation_class?: string
}
