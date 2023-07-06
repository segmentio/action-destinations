// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Identifier used to locate the list.
   */
  listId: number
  /**
   * Email address of the contact.
   */
  emailAddress: string
  /**
   * Profile field values associated with the contact.
   */
  segmentationFieldValues: {
    /**
     * Identifier of the profile field.
     */
    segmentationFieldId: number
    /**
     * Value of the profile field.
     */
    value: string
  }[]
}
