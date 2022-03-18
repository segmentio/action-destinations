export interface Payload {
  customerId: string
  anonymousId?: string
  email: string
  firstName?: string
  lastName?: string
  name?: string
  age?: number
  birthday?: string
  language?: string
  addressCountry?: string
  addressState?: string
  addressCity?: string
  addressPostalCode?: string
  customerSince?: string
  loyaltyStatus?: string
  isNewCustomer?: boolean
  friendbuyAttributes?: {
    [k: string]: unknown
  }
}
