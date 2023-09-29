// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * Yahoo MDM ID provided by Yahoo representative
   */
  mdm_id: string
  /**
   * Taxonomy API client Id. Required to update Yahoo taxonomy
   */
  taxonomy_client_key: string
  /**
   * Taxonomy API client secret. Required to update Yahoo taxonomy
   */
  taxonomy_client_secret: string
  /**
   * Required to create customer and segment nodes in Taxonomy. Provide Engage Space Id found in Unify > Settings > API Access. This maps to the "Id" and "Name" of the top-level Customer node in Yahoo taxonomy
   */
  engage_space_id: string
  /**
   * Required to create customer node in Taxonomy. Provide a description for the Customer node in Yahoo taxonomy. This must be less then 1000 characters
   */
  customer_desc?: string
}
// Generated file. DO NOT MODIFY IT BY HAND.

export interface AudienceSettings {
  /**
   * The advertiser ID to use when syncing audiences. Required if you wish to create or update an audience.
   */
  audience_id?: string
  /**
   * An audience key required by the destination
   */
  audience_key: string
  /**
   * Engage Space Id
   */
  engage_space_id: string
}
