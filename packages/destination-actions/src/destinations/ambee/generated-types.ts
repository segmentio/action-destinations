// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * Enter your company’s name
   */
  companyName: string
  /**
   * The API Key is available via Ambee’s API Dashboard: https://api-dashboard.getambee.com. Paste the API key generated on the homepage. For bulk use, subscribe to enterprise plan on the dashboard
   */
  apiKey: string
  /**
   * Enter the email address you used to sign up for Ambee’s API Key.
   */
  email: string
  /**
   * Your Segment Workspace is hosted in either the US or EU Region. Select which Segment Region Ambee should send notifications to. The default is US
   */
  segmentRegion?: string
  /**
   * This is your Segment Source WriteKey. Use this WriteKey to send data from Ambee to your destination
   */
  segmentWriteKey: string
}
