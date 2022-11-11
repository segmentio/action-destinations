// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The group's custom properties to send to Wisepops.
   */
  traits: {
    [k: string]: unknown
  }
  /**
   * The name of the "container" property. In Wisepops, you access the nested properties like this: `container.property`.
   */
  nestedProperty: string
  /**
   * A unique identifier for the group.
   */
  groupId?: string
  /**
   * By default, custom properties persist across pages. Enable temporary properties to limit them to the current page only.
   */
  temporary?: boolean
}
