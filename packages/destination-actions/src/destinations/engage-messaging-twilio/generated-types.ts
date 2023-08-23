// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * Twilio Account SID
   */
  twilioAccountSID: string
  /**
   * Twilio API Key SID
   */
  twilioApiKeySID: string
  /**
   * Twilio API Key Secret
   */
  twilioApiKeySecret: string
  /**
   * Profile API Environment
   */
  profileApiEnvironment: string
  /**
   * Profile API Access Token
   */
  profileApiAccessToken: string
  /**
   * Space ID
   */
  spaceId: string
  /**
   * Source ID
   */
  sourceId: string
  /**
   * Webhook URL that will receive all events for the sent message
   */
  webhookUrl?: string
  /**
   * Overrides the default Twilio host name used mainly for testing without having to send real messages.
   */
  twilioHostname?: string
  /**
   * Connection overrides are configuration supported by twilio webhook services. Must be passed as fragments on the callback url
   */
  connectionOverrides?: string
  /**
   * The region where the message is originating from
   */
  region?: string
}
