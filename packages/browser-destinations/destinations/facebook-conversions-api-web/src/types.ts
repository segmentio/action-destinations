
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


export type LeadEvent = {
    currency?: string
    value?: number
}

export type FBEvent = LeadEvent

export type FBClient = {
    (command: 'init', pixelId: string): void
    (command: 'track', event: FBStandardEventType, params?: FBEvent, options?: Options): void
    (command: 'trackSingle', pixelId: string, event: FBStandardEventType, params?: FBEvent, options?: Options): void
    (command: 'trackCustom', event: string, params?: FBEvent, options?: Options): void
    (command: 'trackSingleCustom', pixelId: string, event: string, params?: FBEvent, options?: Options): void
}

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

export type ActionSource =
    | 'email'
    | 'website'
    | 'app'
    | 'phone_call'
    | 'chat'
    | 'physical_store'
    | 'system_generated'
    | 'other'