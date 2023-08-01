// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Unique ID for this measurement
   */
  uid: string
  /**
   * Short code identifying the Meter the measurement is for
   */
  meter: string
  /**
   * Code of the Account the measurement is for
   */
  account: string
  /**
   * Timestamp for the measurement
   */
  ts: string | number
  /**
   * End timestamp for the measurement. Can be used in the case a usage event needs to have an explicit start and end rather than being instantaneous
   */
  ets?: string | number
  /**
   * Non-numeric who values for data measurements, such as: who logged-in to the service; who was contacted by the service
   */
  who?: {
    [k: string]: unknown
  }
  /**
   * Non-numeric where values for data measurements such as: where someone logged into your service from
   */
  where?: {
    [k: string]: unknown
  }
  /**
   * Non-numeric what values for data measurements such as: what level of user logged into the service
   */
  what?: {
    [k: string]: unknown
  }
  /**
   * Non-numeric other values for measurements such as textual data which is not applicable to Who, What, or Where events
   */
  other?: {
    [k: string]: unknown
  }
  /**
   * Non-numeric metadata values for measurements using high-cardinality fields that you don't intend to segment when you aggregate the data
   */
  metadata?: {
    [k: string]: unknown
  }
  /**
   * Numeric measure values for general quantitative measurements.
   */
  measure?: {
    [k: string]: unknown
  }
  /**
   * Numeric cost values for measurements associated with costs
   */
  cost?: {
    [k: string]: unknown
  }
  /**
   * Numeric income values for measurements associated with income
   */
  income?: {
    [k: string]: unknown
  }
  /**
   * When enabled the action will send multiple events in a single API request, improving efficiency. This is m3ter’s recommended mode.
   */
  enable_batching: boolean
}
