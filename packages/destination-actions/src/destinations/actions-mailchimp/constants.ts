// Mailchimp Marketing API v3.0 constants

// Base URL is datacenter-specific. The datacenter prefix (e.g. `us6`) is the
// suffix of the API key after the final `-`, or supplied explicitly via settings.
export const getBaseUrl = (dataCenter: string): string => `https://${dataCenter}.api.mailchimp.com/3.0`

// Resolve the datacenter prefix from the API key suffix (e.g. `abc123-us6` -> `us6`).
export const resolveDataCenter = (apiKey: string, override?: string): string => {
  if (override && override.trim() !== '') {
    return override.trim()
  }
  const parts = apiKey.split('-')
  return parts[parts.length - 1]
}

// Endpoint path builders (relative to the datacenter base URL).
export const PING_PATH = '/'
export const memberPath = (listId: string, subscriberHash: string): string =>
  `/lists/${listId}/members/${subscriberHash}`
export const batchMembersPath = (listId: string): string => `/lists/${listId}`
export const memberTagsPath = (listId: string, subscriberHash: string): string =>
  `/lists/${listId}/members/${subscriberHash}/tags`

// Subscription status enum accepted by the Mailchimp member endpoints.
export const SUBSCRIPTION_STATUSES = ['subscribed', 'unsubscribed', 'pending', 'cleaned'] as const
export type SubscriptionStatus = typeof SUBSCRIPTION_STATUSES[number]

// Tag status enum accepted by the member tags endpoint.
export const TAG_STATUSES = ['active', 'inactive'] as const
export type TagStatus = typeof TAG_STATUSES[number]

export const DEFAULT_BATCH_SIZE = 500
