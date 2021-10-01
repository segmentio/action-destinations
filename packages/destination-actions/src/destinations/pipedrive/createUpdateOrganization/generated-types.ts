// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Identifier used to find existing organization in Pipedrive. Typically this is the name but it can also be a custom field value. Custom organization fields may be included by using the long hash keys of the custom fields. These look like "33595c732cd7a027c458ea115a48a7f8a254fa86".
   */
  identifier: string
  /**
   * Name of the organization
   */
  name: string
  /**
   * ID of the user who will be marked as the owner of this organization. Default is the user who ownes the API token.
   */
  owner_id?: number
  /**
   * If the organization is created, use this timestamp as the creation timestamp. Format: YYY-MM-DD HH:MM:SS
   */
  add_time?: string
}
