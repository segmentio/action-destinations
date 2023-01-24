// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Enter the full URL as you see in your Xflow trigger. [See more details on setting up an xflow trigger and getting the URL.](https://static-assets.qualtrics.com/static/integrations-external/twilio_segment_event_webhook_setup_instructions.pdf)
   */
  workflowUrl: string
  /**
   * A mapping of key values to send to Qualtrics xflow.
   */
  eventPayload?: {
    [k: string]: unknown
  }
}
