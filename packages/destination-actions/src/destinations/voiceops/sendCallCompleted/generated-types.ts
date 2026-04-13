// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The external call identifier used by Voiceops.
   */
  call_id: string
  /**
   * The time the call started. This should match the existing Regal payload format.
   */
  call_started_at: string
  /**
   * The email address for the primary handling agent.
   */
  agent_email: string
  /**
   * A link to the single-channel recording for the call.
   */
  mp3_Link?: string
  /**
   * A link to the multi-channel recording when conference splitting is needed.
   */
  multi_channel_recording_link?: string
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
     * The participant type for the channel.
     */
    type?: string
    /**
     * When this participant started in the recording.
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
