// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The name of the event.
   */
  name: string
  /**
   * A JSON object containing additional information about the event that will be indexed by Heap.
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * a string that uniquely identifies a user, such as an email, handle, or username. This means no two users in one environment may share the same identity. More on identify: https://developers.heap.io/docs/using-identify
   */
  identity?: string
  /**
   * The segment anonymous identifier for the user
   */
  anonymousId?: string
  /**
   * An object with key-value properties you want associated with the user. Each property must either be a number or string with fewer than 1024 characters.
   */
  traits?: {
    [k: string]: unknown
  }
}
