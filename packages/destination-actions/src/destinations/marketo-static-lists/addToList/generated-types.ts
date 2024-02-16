// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The ID of the Static List that users will be synced to.
   */
  external_id: string
  /**
   * The lead field to use for deduplication and filtering. This field must be apart of the lead's info fields.
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
    /**
     * The user's first name.
     */
    firstName?: string
    /**
     * The user's last name.
     */
    lastName?: string
    /**
     * The user's phone number.
     */
    phone?: string
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
