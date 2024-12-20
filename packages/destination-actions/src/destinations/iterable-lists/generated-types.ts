// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * To obtain the API Key, go to the Iterable app and naviate to Integrations > API Keys. Create a new API Key with the 'Server-Side' type.
   */
  apiKey: string
}
// Generated file. DO NOT MODIFY IT BY HAND.

export interface AudienceSettings {
  /**
   * Whether to skip operation when the request includes a userId or email that doesn't yet exist in the Iterable project. When true, Iterable ignores requests with unknown userIds and email addresses.
   */
  updateExistingUsersOnly?: boolean
  /**
   * Unsubscribe email from list's associated channel - essentially a global unsubscribe. Only valid for unsubscribe action.
   */
  globalUnsubscribe?: boolean
  /**
   * Campaign ID to associate with the unsubscribe. Only valid for unsubscribe action.
   */
  campaignId?: string
}
