// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Any metadata associated with the attribute.
   */
  properties: {
    [k: string]: unknown
  }
  /**
   * Phone number of the user associated with the action. E.164 format is required. This field is required if either email or an externalIdentifier is not provided.
   */
  phone?: string
  /**
   * Email of the user associated with the action. This field is required if either phone or an externalIdentifier is not provided.
   */
  email?: string
  /**
   * (optional) Your primary ID for a user. This field is required if either phone, email, or a customIdentifier is not provided.
   */
  clientUserId?: string
  /**
   * (optional) Namespaced custom identifiers and their values. This field is required if either phone, email, or a clientUserId is not provided.
   */
  customIdentifiers?: {
    [k: string]: unknown
  }
}
