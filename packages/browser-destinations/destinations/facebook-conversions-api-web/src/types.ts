export interface WindowWithOptionalFbq extends Omit<Window, 'fbq' | '_fbq'> {
  fbq?: FBClient
  _fbq?: FBClient
}

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

export type InitOptions = {
  agent?: string
}

export type EventOptions = {
  eventID?: string
  eventSourceUrl?: string
}

export type UserData = {
  // Identifiers
  external_id?: string // Unique user ID from your system (FB hashes with SHA-256)
  em?: string // Email (FB hashes with SHA-256)
  ph?: string // Phone number (FB hashes with SHA-256)
  fn?: string // First name (FB hashes with SHA-256)
  ln?: string // Last name (FB hashes with SHA-256)
  ge?: 'm' | 'f' // Gender (FB hashes with SHA-256)
  db?: string // Date of birth (FB hashes with SHA-256) - format: YYYYMMDD
  ct?: string // City (FB hashes with SHA-256)
  st?: string // State (FB hashes with SHA-256)
  zp?: string // ZIP/Postal code (FB hashes with SHA-256)
  country?: string // Country code (FB hashes with SHA-256)
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

export type FBClient = {
  disablePushState?: boolean
  loaded?: boolean
  version?: string
  queue?: unknown[]
  push?: FBClient
  callMethod?: (...args: unknown[]) => void
  (command: 'set', key: string, value: boolean, pixelId: string): void
  (command: 'dataProcessingOptions', options: string[], country?: number, state?: number): void
  (command: 'init', pixelId: string, userData?: UserData, options?: InitOptions): void
  (command: 'trackSingle', pixelId: string, event: FBStandardEventType, params?: FBEvent, options?: EventOptions): void
  (command: 'trackSingleCustom', pixelId: string, event: string, params?: FBEvent, options?: EventOptions): void
}

export const LDU = {
  Disabled: { key: 'Disabled', state: undefined, country: undefined },
  GeolocationLogic: { key: 'GeolocationLogic', state: 0, country: 0 },
  California: { key: 'California', state: 1000, country: 1 },
  Colorado: { key: 'Colorado', state: 1001, country: 1 },
  Connecticut: { key: 'Connecticut', state: 1002, country: 1 },
  Florida: { key: 'Florida', state: 1003, country: 1 },
  Oregon: { key: 'Oregon', state: 1004, country: 1 },
  Texas: { key: 'Texas', state: 1005, country: 1 },
  Montana: { key: 'Montana', state: 1006, country: 1 },
  Delaware: { key: 'Delaware', state: 1007, country: 1 },
  Nebraska: { key: 'Nebraska', state: 1008, country: 1 },
  NewHampshire: { key: 'NewHampshire', state: 1009, country: 1 },
  NewJersey: { key: 'NewJersey', state: 1010, country: 1 },
  Minnesota: { key: 'Minnesota', state: 1011, country: 1 }
} as const

export type LDU = typeof LDU[keyof typeof LDU]
