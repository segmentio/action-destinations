// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * Your Datadog API Key. Found in your Datadog dashboard under Organization Settings → API Keys.
   */
  apiKey: string
  /**
   * Your Datadog Application Key. Found in Organization Settings → Application Keys. Required for sending events to Datadog Event Management.
   */
  appKey: string
  /**
   * Your Datadog site region. Determines which regional API endpoint is used for all requests.
   */
  site?: string
}
