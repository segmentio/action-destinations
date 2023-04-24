// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * Pipedrive domain. This is found in Pipedrive in Settings > Company settings > Company domain.
   */
  domain?: string
  /**
   * Pipedrive API token. This is found in Pipedrive in Settings > Personal preferences > API > Your personal API token.
   */
  apiToken?: string
  /**
   * This is a key by which a Person in Pipedrive will be searched. It can be either Person id or has of a custom field containing external id. Default value is `person_id`.
   */
  personField?: string
  /**
   * This is a key by which an Organization in Pipedrive will be searched. It can be either Organization id or has of a custom field containing external id. Default value is `org_id`.
   */
  organizationField?: string
  /**
   * This is a key by which a Deal in Pipedrive will be searched. It can be either Deal id or has of a custom field containing external id. Default value is `deal_id`.
   */
  dealField?: string
}
