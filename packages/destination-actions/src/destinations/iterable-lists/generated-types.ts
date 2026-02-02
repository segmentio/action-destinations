// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  /**
   * To obtain the API Key, go to the Iterable app and naviate to Integrations > API Keys. Create a new API Key with the 'Server-Side' type.
   */
  apiKey: string
  /**
   * Select the type of your Iterable project. Hybrid projects support both email and user ID based identification, while User ID-Based projects only support user ID based identification.
   */
  iterableProjectType?: string
}
// Generated file. DO NOT MODIFY IT BY HAND.

export interface AudienceSettings {
  /**
   * When true, Iterable ignores requests for unknown userIds and email addresses. This field is only relevant for non-email based Iterable projects: For email-based projects users will continue to be created in Iterable if a user is added or removed from a List.
   */
  updateExistingUsersOnly?: boolean
  /**
   * Unsubscribe email from list's associated channel - essentially a global unsubscribe. Only valid when unsubscribing a user from a List.
   */
  globalUnsubscribe?: boolean
  /**
   * The numeric Campaign ID to associate with the unsubscribe. Only valid when unsubscribing a user from a List.
   */
  campaignId?: number
}
