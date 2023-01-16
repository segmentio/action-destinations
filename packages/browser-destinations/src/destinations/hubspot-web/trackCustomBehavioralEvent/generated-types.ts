// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The internal event name assigned by HubSpot. This can be found in your HubSpot account. If the "Format Custom Behavioral Event Names" setting is enabled, Segment will automatically convert your Segment event name into the expected HubSpot internal event name format.
   */
  name: string
  /**
   * A list of key-value pairs that describe the event.
   */
  properties?: {
    [k: string]: unknown
  }
}
