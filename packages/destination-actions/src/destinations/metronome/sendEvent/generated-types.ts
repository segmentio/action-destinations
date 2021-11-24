// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The Metronome transaction ID uniquely identifies an event to ensure Metronome only processes each event once.
   */
  transaction_id: string
  /**
   * The Metronome customer ID or ingest alias this event should be associated with.
   */
  customer_id: string
  /**
   * The timestamp at which this event occurred.
   */
  timestamp: string | number
  /**
   * The Metronome event_type.
   */
  event_type: string
  /**
   * The Metronome properties object.
   */
  properties: {
    [k: string]: unknown
  }
}
