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
   * Optional channel metadata used by Voiceops to split conference bridge recordings and attribute agents.
   */
  channels?: {
    /**
     * The audio channel number.
     */
    channel?: number
    /**
     * The participant role for the channel. Supported values are CONTACT, HANDLING_AGENT, and TRANSFER_AGENT.
     */
    type?: string
    /**
     * The participant start time as an ISO 8601 / RFC3339 timestamp, for example `2025-12-08T13:32:47.000Z`.
     */
    recording_start_time?: string
    /**
     * A participant identifier, usually an email address.
     */
    identifier?: string
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
   * Additional org-specific call metadata to forward to Voiceops unchanged.
   */
  extraMetadata?: {
    [k: string]: unknown
  }
}
