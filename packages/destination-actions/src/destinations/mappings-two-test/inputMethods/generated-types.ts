// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * A test string field
   */
  string_field_no_free_form?: string
  /**
   * A test string field
   */
  string_field_no_picker?: string
  /**
   * A test dynamic string field
   */
  dynamic_string_field?: string
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
   * A test unstructured object
   */
  unstructured_object?: {
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
}
