// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The ID used to uniquely identify a person in Customer.io. [Learn more](https://customer.io/docs/identifying-people/#identifiers).
   */
  person_id: string
  /**
   * An optional anonymous ID. This is used to tie anonymous events to this person. [Learn more](https://customer.io/docs/anonymous-events/).
   */
  anonymous_id?: string
  /**
   * An object ID used to identify an object.
   */
  object_id: string
  /**
   * An object ID type used to identify the type of object.
   */
  object_type_id?: string
}
