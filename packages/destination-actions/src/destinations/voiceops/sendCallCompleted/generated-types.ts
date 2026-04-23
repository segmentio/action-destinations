// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The external call identifier used by Voiceops.
   */
  call_id: string
  /**
   * The call start time as a Unix timestamp in seconds, for example `1712683200`.
   */
  call_started_at: string
  /**
   * The email address for the primary handling agent.
   */
  agent_email: string
  /**
   * A direct URI to the call recording file, for example `https://example.com/audio.wav`.
   */
  recording_url: string
  /**
   * The first name for the primary handling agent.
   */
  first_name?: string
  /**
   * The last name for the primary handling agent.
   */
  last_name?: string
  /**
   * Optional channel metadata for multi-channel audio-aware integrations. Use this when you can provide precise channel-based conference bridge data.
   */
  channels?: {
    /**
     * The audio channel number.
     */
    channel: number
    /**
     * The participant role for the channel. Supported values are CONTACT, HANDLING_AGENT, and TRANSFER_AGENT.
     */
    type: string
    /**
     * The participant start time as an ISO 8601 / RFC3339 timestamp, for example `2025-12-08T13:32:47.000Z`.
     */
    recording_start_time: string
    /**
     * The participant identifier. HANDLING_AGENT entries must use an email address, while CONTACT and TRANSFER_AGENT entries can use any non-empty string.
     */
    identifier: string
    /**
     * The participant first name when available.
     */
    first_name?: string
    /**
     * The participant last name when available.
     */
    last_name?: string
  }[]
  /**
   * Optional warm-transfer metadata for agent handoff windows. Use this when you cannot provide channel-based multi-channel recording data.
   */
  agentLegs?: {
    /**
     * The email address for the agent handling this leg of the call.
     */
    agent_email: string
    /**
     * When this agent began handling the call as an ISO 8601 / RFC3339 timestamp, for example `2025-12-08T13:32:47.000Z`.
     */
    started_at: string
    /**
     * When this agent stopped handling the call as an ISO 8601 / RFC3339 timestamp, for example `2025-12-08T13:37:47.000Z`.
     */
    ended_at?: string
    /**
     * The first name of the agent for this call leg.
     */
    first_name: string
    /**
     * The last name of the agent for this call leg.
     */
    last_name: string
  }[]
  /**
   * Additional call metadata to forward to Voiceops unchanged.
   */
  extraMetadata?: {
    [k: string]: unknown
  }
}
