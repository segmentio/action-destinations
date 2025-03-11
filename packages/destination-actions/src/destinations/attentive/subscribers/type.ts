export interface SubscriberRequest {
  user: SubscriberUser // User object (required)
  signUpSourceId?: string // Optional: Unique sign-up source ID
  locale?: Locale // Optional: Locale object
  subscriptionType: 'MARKETING' | 'TRANSACTIONAL' // Required: Subscription type
  singleOptIn?: boolean // Optional: Skip legal/reply confirmation message
}

export interface SubscriberUser {
  phone?: string // Optional: Phone number in E.164 format
  email?: string // Optional: Email address
}

export interface Locale {
  language: string // Required if locale is used (e.g., "en")
  country: string // Required if locale is used (e.g., "US")
}

export interface Payload {
  userIdentifiers: SubscriberUser // userIdentifiers instead of context
  signUpSourceId?: string
  subscriptionType: 'MARKETING' | 'TRANSACTIONAL'
  locale?: Locale // Corrected to be an object instead of a string
  singleOptIn?: boolean
}
