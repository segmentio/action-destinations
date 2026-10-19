// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The same external call identifier sent with the recording. Use up to 100 letters, numbers, dots, hyphens, or underscores.
   */
  call_id: string
  /**
   * The completion event time as a 10-digit Unix timestamp in seconds. Voiceops uses this to order metadata snapshots. Map Regal completed_at here; do not use the delivery or retry time.
   */
  call_completed_at: string
  /**
   * A nonempty, complete snapshot of call metadata, such as disposition and contact phone. Map individual metadata fields here. Do not include call_id, call_started_at, recording_url, agent_email, channels, agentLegs, voiceops_segment_source_call_id, source.
   */
  extraMetadata: {
    [k: string]: unknown
  }
}
