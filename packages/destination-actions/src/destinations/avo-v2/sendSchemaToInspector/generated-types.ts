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
   * Optional, for gateways only. Requires Gateway Support. Identifies the source that produced each event, so Avo can tell apart events from different apps flowing through a gateway. Usually a static label naming this Segment source, such as "ios-app". If one source carries events from several apps or platforms, map a path instead, such as `$.context.app.name` or `$.context.library.name`. Avo only reads this value when the API key belongs to a gateway, but setting it changes the app version sent with every API key: the App Version field and the App Version Property setting are then ignored, and the version comes from Origin App Version only, or is left empty if Origin App Version is empty. On a regular source, leave this field empty.
   */
  originHint?: string
  /**
   * Optional, for gateways only. Requires Gateway Support. App version of the source that produced each event, for example `$.context.app.version`. When set, it replaces the App Version field and the App Version Property setting for every API key. If Origin Hint is set and this is empty, the event is sent without an app version. On a regular source, leave this field empty and use the App Version field instead.
   */
  originAppVersion?: string
  /**
   * Maximum number of events to include in each batch. Actual batch sizes may be lower.
   */
  batch_size?: number
  /**
   * The keys to use for batching events together.
   */
  batch_keys?: string[]
}
