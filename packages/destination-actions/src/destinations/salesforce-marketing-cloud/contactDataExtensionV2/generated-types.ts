// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
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
// Generated file. DO NOT MODIFY IT BY HAND.

export interface RetlOnMappingSaveInputs {
  /**
   * Whether to create a new data extension or select an existing one for data delivery.
   */
  operation: string
  /**
   * The identifier for the data extension.
   */
  dataExtensionId?: string
  /**
   * The identifier for the folder that contains the data extension.
   */
  categoryId?: string
  /**
   * The name of the data extension.
   */
  name?: string
  /**
   * The description of the data extension.
   */
  description?: string
  /**
   * Indicates whether the custom object can be used to send messages. If the value of this property is true, then the custom object is sendable
   */
  isSendable?: boolean
  /**
   * The field on this data extension which is sendable. This must be a field that is present on this data extension.
   */
  sendableCustomObjectField?: string
  /**
   * The relationship with "Subscribers" for the Sendable Custom Object Field.
   */
  sendableSubscriberField?: string
  /**
   * A list of fields to create in the data extension.
   */
  columns?: {
    /**
     * The name of the field.
     */
    name: string
    /**
     * The data type of the field.
     */
    type: string
    /**
     * Whether the field can be null.
     */
    isNullable: boolean
    /**
     * Whether the field is a primary key.
     */
    isPrimaryKey: boolean
    /**
     * The length of the field. Required for non-boolean fields
     */
    length?: number
    /**
     * The scale of the field. Required for Decimal fields
     */
    scale?: number
    /**
     * The description of the field.
     */
    description?: string
    [k: string]: unknown
  }[]
}
// Generated file. DO NOT MODIFY IT BY HAND.

export interface RetlOnMappingSaveOutputs {
  /**
   * The identifier for the data extension.
   */
  id: string
  /**
   * The name of the data extension.
   */
  name: string
}
// Generated file. DO NOT MODIFY IT BY HAND.

export interface OnMappingSaveInputs {
  /**
   * Whether to create a new data extension or select an existing one for data delivery.
   */
  operation: string
  /**
   * The identifier for the data extension.
   */
  dataExtensionId?: string
  /**
   * The identifier for the folder that contains the data extension.
   */
  categoryId?: string
  /**
   * The name of the data extension.
   */
  name?: string
  /**
   * The description of the data extension.
   */
  description?: string
  /**
   * Indicates whether the custom object can be used to send messages. If the value of this property is true, then the custom object is sendable
   */
  isSendable?: boolean
  /**
   * The field on this data extension which is sendable. This must be a field that is present on this data extension.
   */
  sendableCustomObjectField?: string
  /**
   * The relationship with "Subscribers" for the Sendable Custom Object Field.
   */
  sendableSubscriberField?: string
  /**
   * A list of fields to create in the data extension.
   */
  columns?: {
    /**
     * The name of the field.
     */
    name: string
    /**
     * The data type of the field.
     */
    type: string
    /**
     * Whether the field can be null.
     */
    isNullable: boolean
    /**
     * Whether the field is a primary key.
     */
    isPrimaryKey: boolean
    /**
     * The length of the field. Required for non-boolean fields
     */
    length?: number
    /**
     * The scale of the field. Required for Decimal fields
     */
    scale?: number
    /**
     * The description of the field.
     */
    description?: string
    [k: string]: unknown
  }[]
}
// Generated file. DO NOT MODIFY IT BY HAND.

export interface OnMappingSaveOutputs {
  /**
   * The identifier for the data extension.
   */
  id: string
  /**
   * The name of the data extension.
   */
  name: string
}
