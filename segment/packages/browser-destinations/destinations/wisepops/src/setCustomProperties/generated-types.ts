// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The custom properties to send to Wisepops.
   */
  traits: {
    [k: string]: unknown
  }
  /**
   * A unique identifier. Typically, a user ID or group ID.
   */
  id?: string
  /**
   * How to name the entity ID among the other custom properties?
   */
  idProperty?: string
  /**
   * This lets you define the properties as a nested object. If you set the property `"name"` with the prefix `"group"`, you'll access it in Wisepops as `"group.name"`.
   */
  prefix?: string
}
