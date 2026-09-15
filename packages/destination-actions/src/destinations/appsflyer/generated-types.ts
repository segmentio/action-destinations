// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * Your AppsFlyer S2S token, used to authenticate in-app events. Find it in the AppsFlyer dashboard under Account Settings > API tokens. This is not the same as your Dev Key.
   */
  s2sToken: string
  /**
   * Your AppsFlyer Dev Key, found in the AppsFlyer dashboard under App Settings. Used only to sign Application Installed and Application Opened events. Not required if you only send in-app events.
   */
  devKey?: string
  /**
   * Your iOS App ID, without the `id` prefix. Required to send events from iOS devices.
   */
  appleAppID?: string
  /**
   * Your Android package name. Required to send events from Android devices.
   */
  androidAppID?: string
  /**
   * Your Roku App ID. Required to send events from Roku devices.
   */
  rokuAppID?: string
}
