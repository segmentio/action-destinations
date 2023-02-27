// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The field to use to find the contact
   */
  key_field: string
  /**
   * Value for the key field used to find the contact. E.g. the email address
   */
  key_value: string
  /**
   * Use the emarsys field id (number) as key and set a value (string) (static, function or event variable)
   */
  write_field: {
    '1'?: string
    '2'?: string
    '3'?: string
  }
}
