// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Name of the event
   */
  name: string
  /**
   * Custom data to include with the event. If "recipient", "from_address", or "reply_to" are sent, they will override settings on any campaigns triggered by this event. "recipient" is required if the event is used to trigger a campaign.
   */
  data?: {
    [k: string]: unknown
  }
}
