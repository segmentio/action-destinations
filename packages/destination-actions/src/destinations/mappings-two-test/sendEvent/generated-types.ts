// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * A test string field
   */
  test_field?: string
  /**
   * A dynamic object
   */
  dynamic_object: {
    [k: string]: unknown
  }
  /**
   * Choose a pet or plant and provide details
   */
  dynamic_structured_object: {
    /**
     * Pet type
     */
    pet?: string
    /**
     * Plant type
     */
    plant?: string
    /**
     * Name
     */
    name?: string
    /**
     * Age
     */
    age?: number
  }
}
