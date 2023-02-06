// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * Site Access ID. An ID that’s unique for each site within your account. Information on finding your sid can be found in the authentication section.
   */
  sid: string
  /**
   * Turn this ON, to send requests to the staging server, ONLY if Clickwrap support instructs you to do so.
   */
  staging_endpoint?: boolean
  /**
   * Test Mode, whether or not to process the acceptance in test_mode. Defaults to false, Toggle to ON to enable it.
   */
  test_mode?: boolean
}
