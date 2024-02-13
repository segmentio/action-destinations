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
}
