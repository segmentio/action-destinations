// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The ID of the audience to which you want to add or remove users.
   */
  audience_id: string
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
   * The operation to perform on the audience.
   */
  operation: string
  /**
   * Enable batching of user syncs to optimize performance. When enabled, user syncs will be sent in batches based on the specified batch size.
   */
  enable_batching: boolean
  /**
   * The number of user syncs to include in each batch when batching is enabled. Must be between 1 and 1000.
   */
  batch_size: number
}
