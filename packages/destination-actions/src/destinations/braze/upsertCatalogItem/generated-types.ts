// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The Name of the catalog to which the item belongs.
   */
  catalog_name: string
  /**
   * The item to upsert in the catalog. The item objects should contain fields that exist in the catalog
   */
  item?: {
    [k: string]: unknown
  }
  /**
   * The unique identifier for the item. This field is required. Maximum 250 characters. Supported characters for item ID names are letters, numbers, hyphens, and underscores.
   */
  item_id: string
  /**
   * If true, Segment will batch events before sending to Braze.
   */
  enable_batching?: boolean
  /**
   * If batching is enabled, this is of events to include in each batch. Maximum 50 events per batch.
   */
  batch_size?: number
}
