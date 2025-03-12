// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Note: This field should be considered deprecated in favor of the hook input field "Data Extension ID". For backwards compatibility the field will not be deleted, and is instead hidden. The external key of the data extension that you want to store information in. The data extension must be predefined in SFMC. The external key is required if a Data Extension ID is not provided.
   */
  key?: string
  /**
   * Note: This field should be considered deprecated in favor of the hook input field "Data Extension ID". For backwards compatibility the field will not be deleted, and is instead hidden. The ID of the data extension that you want to store information in. The data extension must be predefined in SFMC. The ID is required if a Data Extension Key is not provided.
   */
  id?: string
  /**
   * The primary key(s) that uniquely identify a row in the data extension. On the left-hand side, input the SFMC key name. On the right-hand side, map the Segment field that contains the corresponding value. When multiple primary keys are provided, SFMC will update an existing row if all primary keys match, otherwise a new row will be created
   */
  keys: {
    [k: string]: unknown
  }
  /**
   * The fields in the data extension that contain data about an event, such as Product Name, Revenue, Event Time, etc. Fields must be created in the data extension before sending data for it. On the left-hand side, input the SFMC field name exactly how it appears in the data extension. On the right-hand side, map the Segment field that contains the corresponding value.
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
   * The field on this data extension that is sendable.
   */
  sendableCustomObjectField?: string
  /**
   * The field on another data extension?
   */
  sendableSubscriberField?: string
  /**
   * The data retention properties for the data extension.
   */
  dataRetentionProperties?: {
    /**
     * Whether the data retention is row based.
     */
    isRowBasedRetention?: boolean
    /**
     * The data retention period.
     */
    dataRetentionPeriod?: string
    /**
     * The data retention length.
     */
    dataRetentionLength?: string
  }
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
   * The field on this data extension that is sendable.
   */
  sendableCustomObjectField?: string
  /**
   * The field on another data extension?
   */
  sendableSubscriberField?: string
  /**
   * The data retention properties for the data extension.
   */
  dataRetentionProperties?: {
    /**
     * Whether the data retention is row based.
     */
    isRowBasedRetention?: boolean
    /**
     * The data retention period.
     */
    dataRetentionPeriod?: string
    /**
     * The data retention length.
     */
    dataRetentionLength?: string
  }
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
