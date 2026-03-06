// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The external key of the data extension that you want to store information in. The data extension must be predefined in SFMC. The external key is required if a Data Extension ID is not provided.
   */
  key?: string
  /**
   * The ID of the data extension that you want to store information in. The data extension must be predefined in SFMC. The ID is required if a Data Extension Key is not provided.
   */
  id?: string
  /**
   * The Primary Key is a unique identifier for each row in the Data Extension. In the mapping configuration, enter the SFMC Key Name on the left and map the corresponding Segment Field on the right. Each Data Extension supports only one Primary Key. When data is sent to SFMC, the system will update an existing row if the Primary Key matches; otherwise, it will create a new record.
   */
  keys: {
    /**
     * The unique identifier that you assign to a contact. Contact Key must be a Primary Key in the data extension that contains contact information.
     */
    contactKey: string
    [k: string]: unknown
  }
  /**
   * The fields in the data extension that contain data about a contact, such as Email, Last Name, etc. Fields must be created in the data extension before sending data for it. On the left-hand side, input the SFMC field name exactly how it appears in the data extension. On the right-hand side, map the Segment field that contains the corresponding value.
   */
  values: {
    [k: string]: unknown
  }
  /**
   * If true, data is batched before sending to the SFMC Data Extension.
   */
  enable_batching?: boolean
  /**
   * Maximum number of events to include in each batch. Actual batch sizes may be lower.
   */
  batch_size?: number
}
