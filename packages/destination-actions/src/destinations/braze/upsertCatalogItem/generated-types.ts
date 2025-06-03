// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The item to upsert in the catalog. The item objects should contain fields that exist in the catalog. The item object is not required when the syncMode is set to delete. The item object should not contain the id field.
   */
  item?: {
    [k: string]: unknown
  }
  /**
   * The unique identifier for the item. Maximum 250 characters. Supported characters: letters, numbers, hyphens, and underscores.
   */
  item_id: string
  /**
   * If true, Segment will batch events before sending to Braze.
   */
  enable_batching?: boolean
  /**
   * If batching is enabled, this is the number of events to include in each batch. Maximum 50 events per batch.
   */
  batch_size?: number
}
// Generated file. DO NOT MODIFY IT BY HAND.

export interface OnMappingSaveInputs {
  /**
   * Whether to select an existing catalog or create a new one in Braze.
   */
  operation: string
  /**
   * The unique name of the catalog.
   */
  selected_catalog_name?: string
  /**
   * The name of the catalog. Must be unique. Maximum 250 characters. Supported characters: letters, numbers, hyphens, and underscores.
   */
  created_catalog_name?: string
  /**
   * The description of the catalog. Maximum 250 characters.
   */
  description?: string
  /**
   * A list of fields to create in the catalog. Maximum 500 fields. ID field is added by default.
   */
  columns?: {
    /**
     * The name of the field.
     */
    name: string
    /**
     * The data type of the field.
     */
    type: string
    [k: string]: unknown
  }[]
}
// Generated file. DO NOT MODIFY IT BY HAND.

export interface OnMappingSaveOutputs {
  /**
   * The name of the catalog.
   */
  catalog_name: string
}
