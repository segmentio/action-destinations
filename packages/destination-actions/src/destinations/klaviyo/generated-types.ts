// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * You can find this by going to Klaviyo's UI and clicking Account > Settings > API Keys > Create API Key
   */
  api_key: string
}
// Generated file. DO NOT MODIFY IT BY HAND.

export interface AudienceSettings {
  /**
   * The default List ID to subscribe users to. This list takes precedence over the new list segment auto creates when attaching this destination to an audience.
   */
  listId?: string
  /**
   * Use double_opt_in to require confirmation from subscribers. Use single_opt_in if you want immediate subscriptions with no user confirmation.
   */
  optInProcess?: string
}
