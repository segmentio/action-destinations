// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The unique key for an event definition in Salesforce Marketing Cloud. The event defintion must be predefined in SFMC.
   */
  eventDefinitionKey: string
  /**
   * The unique identifier that identifies a subscriber or a contact.
   */
  contactKey: string
  /**
   * The properties of the event. Fields must be created in the event definition schema before sending data for it. On the left-hand side, input the SFMC field name exactly how it appears in the event definition schema. On the right-hand side, map the Segment field that contains the corresponding value.
   */
  data?: {
    [k: string]: unknown
  }
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
  /**
   * Field type coverage test: string.
   */
  test_type_string?: string
  /**
   * Field type coverage test: text.
   */
  test_type_text?: string
  /**
   * Field type coverage test: number.
   */
  test_type_number?: number
  /**
   * Field type coverage test: integer.
   */
  test_type_integer?: number
  /**
   * Field type coverage test: datetime.
   */
  test_type_datetime?: string | number
  /**
   * Field type coverage test: boolean.
   */
  test_type_boolean?: boolean
  /**
   * Field type coverage test: password.
   */
  test_type_password?: string
  /**
   * Field type coverage test: object.
   */
  test_type_object?: {
    /**
     * An example nested property.
     */
    exampleKey?: string
  }
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
  /**
   * Output type coverage test: string.
   */
  test_output_string?: string
  /**
   * Output type coverage test: text.
   */
  test_output_text?: string
  /**
   * Output type coverage test: number.
   */
  test_output_number?: number
  /**
   * Output type coverage test: integer.
   */
  test_output_integer?: number
  /**
   * Output type coverage test: datetime.
   */
  test_output_datetime?: string | number
  /**
   * Output type coverage test: boolean.
   */
  test_output_boolean?: boolean
  /**
   * Output type coverage test: password.
   */
  test_output_password?: string
  /**
   * Output type coverage test: object.
   */
  test_output_object?: {
    [k: string]: unknown
  }
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
  /**
   * Field type coverage test: string.
   */
  test_type_string?: string
  /**
   * Field type coverage test: text.
   */
  test_type_text?: string
  /**
   * Field type coverage test: number.
   */
  test_type_number?: number
  /**
   * Field type coverage test: integer.
   */
  test_type_integer?: number
  /**
   * Field type coverage test: datetime.
   */
  test_type_datetime?: string | number
  /**
   * Field type coverage test: boolean.
   */
  test_type_boolean?: boolean
  /**
   * Field type coverage test: password.
   */
  test_type_password?: string
  /**
   * Field type coverage test: object.
   */
  test_type_object?: {
    /**
     * An example nested property.
     */
    exampleKey?: string
  }
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
  /**
   * Output type coverage test: string.
   */
  test_output_string?: string
  /**
   * Output type coverage test: text.
   */
  test_output_text?: string
  /**
   * Output type coverage test: number.
   */
  test_output_number?: number
  /**
   * Output type coverage test: integer.
   */
  test_output_integer?: number
  /**
   * Output type coverage test: datetime.
   */
  test_output_datetime?: string | number
  /**
   * Output type coverage test: boolean.
   */
  test_output_boolean?: boolean
  /**
   * Output type coverage test: password.
   */
  test_output_password?: string
  /**
   * Output type coverage test: object.
   */
  test_output_object?: {
    [k: string]: unknown
  }
}
