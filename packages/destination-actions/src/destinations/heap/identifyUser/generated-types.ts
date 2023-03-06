// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * A unique identity and maintain user histories across sessions and devices under a single profile. If no identity is provided we will add the anonymous_id to the event. More on identify: https://developers.heap.io/docs/using-identify
   */
  identity?: string | null
  /**
   * The generated anonymous ID for the user.
   */
  anonymous_id?: string | null
  /**
   * An object with key-value properties you want associated with the user. Each key and property must either be a number or string with fewer than 1024 characters.
   */
  traits?: {
    [k: string]: unknown
  }
}
