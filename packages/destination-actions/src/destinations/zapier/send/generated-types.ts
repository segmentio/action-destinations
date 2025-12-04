// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The payload to send to Zapier
   */
  data: {
    [k: string]: unknown
  }
  /**
   * The Zapier webhook URL to send the data to
   */
  zapSubscriptionUrl: string
  /**
   * An identifier for the Zapier Zap (for your reference)
   */
  zapIdentifier?: string
}
