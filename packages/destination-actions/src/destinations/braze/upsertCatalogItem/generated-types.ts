// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The name of the catalog to upsert the item to.
   */
  catalog_name: string
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
  /**
   * The keys to use for batching the events.
   */
  batch_keys?: string[]
}
