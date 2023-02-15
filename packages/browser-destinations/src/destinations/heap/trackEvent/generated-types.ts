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
   * The segment anonymous identifier for the user
   */
  anonymousId?: string
}
