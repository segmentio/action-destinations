// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The event name
   */
  event: string
  /**
   * The thread ID, used to associate events within a thread
   */
  thread_id?: string
  /**
   * The event text (if not an LLM prompt or generation)
   */
  text?: string
  /**
   * A user prompt to an LLM
   */
  prompt?: string
  /**
   * An LLM assistant response
   */
  generation?: string
  /**
   * The LLM assistant ID (often the model name)
   */
  assistant_id?: string
  /**
   * The latency in seconds between the LLM prompt and generation
   */
  latency?: number
  /**
   * Properties to send with the event
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * Context properties to send with the event
   */
  context?: {
    [k: string]: unknown
  }
  /**
   * The timestamp of the event
   */
  timestamp?: string
  /**
   * The ID associated with the user
   */
  user_id?: string
  /**
   * The Anonymous ID associated with the user
   */
  anonymous_id?: string
}
