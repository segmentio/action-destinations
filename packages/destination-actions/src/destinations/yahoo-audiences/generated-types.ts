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
   * Segment Audience Id (aud_...). Maps to "Id" of a Segment node in Yahoo taxonomy.
   */
  audience_id?: string
  /**
   * Segment Audience Key. Maps to the "Name" of the Segment node in Yahoo taxonomy.
   */
  audience_key: string
  /**
   * Engage Space Id found in Unify > Settings > API Access.
   */
  engage_space_id: string
}
