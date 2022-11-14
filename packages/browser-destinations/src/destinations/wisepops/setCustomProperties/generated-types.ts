// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The custom properties to send to Wisepops.
   */
  traits: {
    [k: string]: unknown
  }
  /**
   * This lets you to store the properties as a nested object. If you set the property `name` with the prefix `group`, you'll access it in Wisepops as `group.name`.
   */
  prefix?: string
  /**
   * A unique identifier. Typically a user or group ID.
   */
  id?: string
  /**
   * What property name should be used to set the entity ID as a Wisepops custom property?
   */
  idProperty?: string
  /**
   * By default, custom properties persist across pages. Enable temporary properties to limit them to the current page only.
   */
  temporary?: boolean
}
