// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The event name
   */
  event: string
  /**
   * The timestamp of the event
   */
  timestamp?: string
  /**
   * The ID associated with the user
   */
  user_id?: string
  /**
   * The properties associated with an LLM event
   */
  llm_properties?: {
    /**
     * The LLM assistant ID (often the model name)
     */
    assistant_id?: string
    /**
     * A user prompt to an LLM
     */
    prompt?: string
    /**
     * An LLM assistant response
     */
    generation?: string
    /**
     * The thread/conversation ID of the LLM conversation.
     */
    thread_id?: string
    /**
     * The latency in seconds between the LLM prompt and generation
     */
    latency?: number
  }
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
   * The Anonymous ID associated with the user
   */
  anonymous_id?: string
}
