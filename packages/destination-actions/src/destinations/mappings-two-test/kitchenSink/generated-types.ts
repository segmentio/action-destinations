// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * A test string field
   */
  string_field?: string
  /**
   * A test dynamic string field
   */
  dynamic_string_field?: string[]
  /**
   * A test number field
   */
  number_field: number
  /**
   * A test boolean field
   */
  boolean_field?: boolean
  /**
   * A test select field to pick a single string value
   */
  string_select?: string
  /**
   * A test select field to pick a single number value
   */
  select_number?: number
  /**
   * A test array of string field
   */
  array_field?: string[]
  /**
   * A test date time field
   */
  date_time_field?: string | number
  /**
   * A test integer field
   */
  integer_field?: number
  /**
   * A test password field
   */
  password_field?: string
  /**
   * A Text Field
   */
  text_field?: string
  /**
   * A test unstructured object
   */
  unstructured_object?: {
    [k: string]: unknown
  }
  /**
   * A test unstructured object
   */
  mappable_object?: {
    [k: string]: unknown
  }
  /**
   * A test unstructured object that is both mappable and editable
   */
  mappable_and_editable_object?: {
    [k: string]: unknown
  }
  /**
   * A test structured object
   */
  structured_object?: {
    /**
     * A test string field
     */
    name?: string
    /**
     * A test number field
     */
    age?: number
    /**
     * A test boolean field
     */
    is_active?: boolean
    /**
     * A test select field to pick a single string value
     */
    role?: string
  }
  /**
   * A test structured object with additional properties
   */
  structured_object_with_additional_properties?: {
    /**
     * A test string field
     */
    name?: string
    /**
     * A test number field
     */
    age?: number
    [k: string]: unknown
  }
  /**
   * A test structured array of objects
   */
  structured_array_of_objects?: {
    /**
     * A test string field
     */
    name?: string
    /**
     * A test number field
     */
    age?: number
  }[]
  /**
   * A test structured array of objects with additional properties
   */
  structured_array_of_objects_with_additional_props?: {
    /**
     * A test string field
     */
    name?: string
    /**
     * A test number field
     */
    age?: number
    [k: string]: unknown
  }[]
}
// Generated bundle for hooks. DO NOT MODIFY IT BY HAND.

export interface HookBundle {
  onMappingSave: {
    inputs?: {
      /**
       * A test structured object
       */
      structured_hook_input?: {
        /**
         * A test string field
         */
        name?: string
        /**
         * A test number field
         */
        age?: number
      }
    }
    outputs?: {}
  }
}
