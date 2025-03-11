// types.ts

export interface CustomAttributes {
  user: User // User object
  attributes: Record<string, any> // Custom attributes to be sent to Attentive
}

export interface User {
  phone?: string // Optional phone number
  email?: string // Optional email address
  externalIdentifiers?: {
    // Optional external identifiers
    clientUserId?: string // Optional custom user ID
    [key: string]: string | undefined // Additional custom identifiers
  }
}
