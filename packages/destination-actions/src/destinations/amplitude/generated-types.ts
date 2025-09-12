// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * Amplitude project API key. You can find this key in the "General" tab of your Amplitude project.
   */
  apiKey: string
  /**
   * Amplitude project secret key. You can find this key in the "General" tab of your Amplitude project.
   */
  secretKey: string
  /**
   * The region to send your data.
   */
  endpoint?: string
  /**
   * When enabled, the session start and end timestamps will be sent to Amplitude. This is useful for tracking user sessions.
   */
  trackSession?: boolean
}
