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
   * Engage Space Id found in Unify > Settings > API Access
   */
  engage_space_id: string
  /**
   * Engage space name and description
   */
  customer_desc?: string
}
// Generated file. DO NOT MODIFY IT BY HAND.

export interface AudienceSettings {
  /**
   * Segment Audience Id (aud_...)
   */
  audience_id?: string
  /**
   * Segment Audience Key
   */
  audience_key: string
  /**
   * Engage Space Id found in Unify > Settings > API Access
   */
  engage_space_id: string
}
