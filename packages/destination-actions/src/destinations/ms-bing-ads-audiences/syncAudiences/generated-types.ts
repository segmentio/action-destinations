// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The ID of the audience to which you want to add or remove users.
   */
  audience_id: string
  /**
   * [Hidden] properties object from track() payloads. Note: identify calls are not handled and are disabled in the Partner Portal.
   */
  traits_or_props: {
    [k: string]: unknown
  }
  /**
   * [Hidden]: The Engage Audience Key / Slug.
   */
  audience_key: string
  /**
   * The type of identifier you are using to sync users.
   */
  identifier_type: string
  /**
   * The email address of the user to add or remove from the audience.
   */
  email?: string
  /**
   * The CRM ID of the user to add or remove from the audience.
   */
  crm_id?: string
  /**
   * Enable batching of user syncs to optimize performance. When enabled, user syncs will be sent in batches based on the specified batch size.
   */
  enable_batching: boolean
  /**
   * [Hidden] The number of user syncs to include in each batch when batching is enabled. Must be between 1 and 1000.
   */
  batch_size: number
  /**
   * Hidden field: The computation class for the audience.
   */
  computation_class: string
}
