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
   * Optional. Leave empty to report events at the gateway checkpoint: every event this mapping receives, as Segment receives it. To report the checkpoint of one of your other destinations (an output), add one Avo mapping per output, copy that output's trigger onto it, and paste the output's reference here. Copy the reference from the Inspector Setup tab of your gateway source in Avo. Avo cannot see inside your other destinations: this mapping MIRRORS the output's configuration rather than observing what the output actually sends, so keep its trigger in sync with the output. Only used when the API key belongs to a gateway in Avo; other keys ignore it.
   */
  outputReference?: string
  /**
   * Optional, for gateways only. Identifies the source that produced each event, so Avo can tell apart events from different apps flowing through a gateway. Map a path such as `$.context.library.name`, or enter a static label. Avo only reads this value when the API key belongs to a gateway, but setting it changes the app version sent with every API key: the App Version field and the App Version Property setting are then ignored, and the version comes from Origin App Version only, or is left empty if Origin App Version is empty. On a regular source, leave this field empty.
   */
  originHint?: string
  /**
   * Optional, for gateways only. App version of the source that produced each event, for example `$.context.app.version`. When set, it replaces the App Version field and the App Version Property setting for every API key. If Origin Hint is set and this is empty, the event is sent without an app version. On a regular source, leave this field empty and use the App Version field instead.
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
