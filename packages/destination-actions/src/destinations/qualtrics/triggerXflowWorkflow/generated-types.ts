// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * Enter the full URL as you see in your Xflow trigger. See more details on setting up an xflow trigger and getting the URL here
   */
  workflowUrl: string
  /**
   * A mapping of key values to send to Qualtrics xflow
   */
  eventPayload?: {
    [k: string]: unknown
  }
}
