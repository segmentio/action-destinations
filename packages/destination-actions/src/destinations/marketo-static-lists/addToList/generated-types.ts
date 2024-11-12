// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The ID of the Static List that users will be synced to.
   */
  external_id?: string
  /**
   * The lead field to use for deduplication and filtering. This field must be apart of the Lead Info Fields below.
   */
  lookup_field: string
  /**
   * The fields that contain data about the lead, such as Email, Last Name, etc. On the left-hand side, input the field name exactly how it appears in Marketo. On the right-hand side, map the Segment field that contains the corresponding value.
   */
  data: {
    /**
     * The user's email address to send to Marketo.
     */
    email?: string
    [k: string]: unknown
  }
  /**
   * Enable batching of requests.
   */
  enable_batching: boolean
  /**
   * Maximum number of events to include in each batch. Actual batch sizes may be lower.
   */
  batch_size: number
  /**
   * The name of the current Segment event.
   */
  event_name: string
}
// Generated bundle for hooks. DO NOT MODIFY IT BY HAND.

export interface HookBundle {
  retlOnMappingSave: {
    inputs?: {
      /**
       * The ID of the Marketo Static List that users will be synced to. If defined, we will not create a new list.
       */
      list_id?: string
      /**
       * The name of the Marketo Static List that you would like to create.
       */
      list_name?: string
    }
    outputs?: {
      /**
       * The ID of the created Marketo Static List that users will be synced to.
       */
      id?: string
      /**
       * The name of the created Marketo Static List that users will be synced to.
       */
      name?: string
    }
  }
}
