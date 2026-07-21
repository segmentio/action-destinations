// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The name of the event. This is used by pricing metrics to aggregate usage events.
   */
  event_name: string
  /**
   * The ID or external ID of the subject that the usage event is for.
   */
  subject_id: string
  /**
   * The idempotency key for the usage event. This ensures that the same event is not processed multiple times.
   */
  idempotency_key: string
  /**
   * The timestamp of the usage event (ISO 8601 format). If not provided, the current timestamp will be used.
   */
  timestamp?: string | number
  /**
   * The data of the usage event. This should contain any data that is needed to aggregate the usage event.
   */
  data?: {
    [k: string]: unknown
  }
}
