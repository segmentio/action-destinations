// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Name of the event being sent
   */
  event: string
  /**
   * Properties of the event being sent
   */
  properties: {
    [k: string]: unknown
  }
  /**
   * Message ID of the event being sent
   */
  messageId: string
  /**
   * Timestamp of when the event was sent
   */
  createdAt: string
  /**
   * Version of the app that sent the event
   */
  appVersion?: string
  /**
   * Name of the app that sent the event
   */
  appName?: string
  /**
   * URL of the page that sent the event
   */
  pageUrl?: string
  /**
   * Anonymous ID of the user. Used as stream identifier for batching and event spec fetching.
   */
  anonymousId?: string
  /**
   * User ID of the user. Used as fallback stream identifier (hashed) when anonymousId is not available.
   */
  userId?: string
  /**
   * Optional, for gateways only. Requires Gateway Support. Identifies an Avo gateway output. Leave this field empty unless Avo asks you to set it.
   */
  outputReference?: string
  /**
   * Optional. Requires Gateway Support. Names the source that produced each event, such as "ios-app", so Avo can tell apart apps flowing through a gateway. See https://www.avo.app/docs/inspector/connect-inspector-to-segment-gateway.
   */
  originHint?: string
  /**
   * Requires Gateway Support. The event context, used by Gateway Inspection Scope.
   */
  context?: {
    [k: string]: unknown
  }
  /**
   * Requires Gateway Support. Used by Gateway Inspection Scope.
   */
  originalTimestamp?: string
  /**
   * Requires Gateway Support. Used by Gateway Inspection Scope.
   */
  sentAt?: string
  /**
   * Requires Gateway Support. Used by Gateway Inspection Scope.
   */
  receivedAt?: string
  /**
   * Maximum number of events to include in each batch. Actual batch sizes may be lower.
   */
  batch_size?: number
  /**
   * The keys to use for batching events together.
   */
  batch_keys?: string[]
}
