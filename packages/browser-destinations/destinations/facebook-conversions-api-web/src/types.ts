
export type FBStandardEventType =
  | 'PageView'
  | 'ViewContent'
  | 'Search'
  | 'AddToCart'
  | 'AddToWishlist'
  | 'InitiateCheckout'
  | 'AddPaymentInfo'
  | 'Purchase'
  | 'Lead'
  | 'CompleteRegistration'
  | 'Contact'
  | 'CustomizeProduct'
  | 'Donate'
  | 'FindLocation'
  | 'Schedule'
  | 'StartTrial'
  | 'SubmitApplication'
  | 'Subscribe'

export type FBNonStandardEventType = 'CustomEvent'

export type FieldName = 
 | 'content_category' 
 | 'content_ids'
 | 'content_name'
 | 'content_type'
 | 'contents'
 | 'currency'
 | 'num_items'
 | 'predicted_ltv'
 | 'status'
 | 'value'

export type FBClient = {
    (command: 'init', pixelId: string): void
    (command: 'trackSingle', pixelId: string, event: FBStandardEventType, params?: FBEvent, options?: Options): void
    (command: 'trackSingleCustom', pixelId: string, event: string, params?: FBEvent, options?: Options): void
    (command: 'track', event: FBStandardEventType, params?: FBEvent): void
    (command: 'trackCustom', event: string, params?: FBEvent): void
}

export type FBEvent = {
  content_category?: string
  content_ids?: string[]
  content_name?: string
  content_type?: string
  contents?: {
    id: string
    quantity: number
    item_price?: number
    [k: string]: unknown
  }[]
  currency?: string
  delivery_category?: string
  num_items?: number
  value?: number 
  custom_data?: {
    [k: string]: unknown
  }
}

export const ACTION_SOURCES = {
  email: 'email',
  website: 'website',
  app: 'app',
  phone_call: 'phone_call',
  chat: 'chat',
  physical_store: 'physical_store',
  system_generated: 'system_generated',
  other: 'other'
} as const

export type ActionSource = typeof ACTION_SOURCES[keyof typeof ACTION_SOURCES]

export type Options = { 
    eventID?: string 
    eventSourceUrl?: string
    userData?: UserData
    actionSource?: ActionSource
}

export type UserData = {
    // Identifiers
    external_id?: string // Unique user ID from your system (SHA-256)

    em?: string // Email (SHA-256)
    ph?: string // Phone number (SHA-256)
    fn?: string // First name (SHA-256)
    ln?: string // Last name (SHA-256)
    ge?: string // Gender (SHA-256)
    db?: string // Date of birth (SHA-256) - format: YYYYMMDD
    ct?: string // City (SHA-256)
    st?: string // State (SHA-256)
    zp?: string // ZIP/Postal code (SHA-256)
    country?: string // Country code (SHA-256)
}

export const LDU = {
  Disabled: {key: 'Disabled', state: undefined, country: undefined},
  GeolocationLogic: {key: 'GeolocationLogic', state: 0, country: 0},
  California: {key: 'California', state: 1000, country: 1},
  Colorado: {key: 'Colorado', state: 1001, country: 1},
  Connecticut: {key: 'Connecticut', state: 1002, country: 1},
  Florida: {key: 'Florida', state: 1003, country: 1},
  Oregon: {key: 'Oregon', state: 1004, country: 1},
  Texas: {key: 'Texas', state: 1005, country: 1},
  Montana: {key: 'Montana', state: 1006, country: 1},
  Delaware: {key: 'Delaware', state: 1007, country: 1},
  Nebraska: {key: 'Nebraska', state: 1008, country: 1},
  NewHampshire: {key: 'NewHampshire', state: 1009, country: 1},
  NewJersey: {key: 'NewJersey', state: 1010, country: 1},
  Minnesota: {key: 'Minnesota', state: 1011, country: 1}
} as const

export type LDU = typeof LDU[keyof typeof LDU]