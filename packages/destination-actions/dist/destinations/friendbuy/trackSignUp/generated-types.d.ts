export interface Payload {
  customerId: string
  anonymousId?: string
  email: string
  isNewCustomer?: boolean
  loyaltyStatus?: string
  firstName?: string
  lastName?: string
  name?: string
  age?: number
  birthday?: string
  coupon?: string
  attributionId?: string
  referralCode?: string
  friendbuyAttributes?: {
    [k: string]: unknown
  }
  pageUrl?: string
  pageTitle?: string
  userAgent?: string
  ipAddress?: string
}
