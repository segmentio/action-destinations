// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * For regular analytics events, use `track`. For page views, use `page`. For mobile screens, use `screen`.
   */
  event_type: string
  /**
   * The name of the event to track
   */
  event_name: string
  /**
   * The distinct ID of the user
   */
  distinct_id: string
  /**
   * The properties of the event
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * The current URL of the page being viewed. Only required for page events.
   */
  current_url?: string
  /**
   * The name of the mobile screen being viewed. Only required for screen events.
   */
  screen_name?: string
  /**
   * To capture this event as an [anonymous event](https://posthog.com/docs/data/anonymous-vs-identified-events), set this field to `true`
   */
  anonymous_event_capture: boolean
  /**
   * The timestamp of the event
   */
  timestamp?: string | number
  /**
   * If enabled, event may be batched and send in bulk to Posthog.
   */
  enable_batching: boolean
  /**
   * Maximum number of events to include in each batch. Actual batch sizes may be lower.
   */
  batch_size?: number
}
