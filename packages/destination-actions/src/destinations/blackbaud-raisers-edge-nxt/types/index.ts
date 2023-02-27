export interface RefreshTokenResponse {
  access_token: string
}

export interface StringIndexedObject {
  [key: string]: any
}

export interface FuzzyDate {
  d: string
  m: string
  y: string
}

export interface Constituent {
  address?: Address
  birthdate?: FuzzyDate
  email?: Email
  first?: string
  gender?: string
  income?: string
  last?: string
  lookup_id?: string
  online_presence?: OnlinePresence
  phone?: Phone
  type?: string
}

export interface Address {
  address_lines?: string
  city?: string
  country?: string
  do_not_mail?: boolean
  postal_code?: string
  primary?: boolean
  state?: string
  type?: string
  inactive?: boolean
}

export interface ExistingAddress extends Address {
  id: string
}

export interface Email {
  address?: string
  do_not_email?: boolean
  primary?: boolean
  type?: string
  inactive?: boolean
}

export interface ExistingEmail extends Email {
  id: string
}

export interface OnlinePresence {
  address?: string
  primary?: boolean
  type?: string
  inactive?: boolean
}

export interface ExistingOnlinePresence extends OnlinePresence {
  id: string
}

export interface Phone {
  do_not_call?: boolean
  number?: string
  primary?: boolean
  type?: string
  inactive?: boolean
}

export interface ExistingPhone extends Phone {
  id: string
}
