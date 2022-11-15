// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The key of the data extension that you want to store contact information in. The data extension must be predefined in SFMC. Segment recommends storing all contact information in a single data extension. The key is required if a Data Extension ID is not provided.
   */
  key?: string
  /**
   * The ID of the data extension that you want to store contact information in. The data extension must be predefined in SFMC. Segment recommends storing all contact information in a single data extension. The ID is required if a Data Extension Key is not provided.
   */
  id?: string
  /**
   * The primary key(s) that uniquely identify a contact in the data extension. At a minimum, Contact Key must exist in your data extension as a Primary Key. On the left-hand side, input the SFMC key name. On the right-hand side, map the Segment field that contains the corresponding value. When multiple primary keys are provided, SFMC will update an existing row if all primary keys match, otherwise a new row will be created.
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
}
