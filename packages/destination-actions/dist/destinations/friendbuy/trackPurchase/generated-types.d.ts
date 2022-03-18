export interface Payload {
  orderId: string
  amount: number
  currency: string
  coupon?: string
  attributionId?: string
  referralCode?: string
  giftCardCodes?: string[]
  products?: {
    sku?: string
    name?: string
    quantity?: number
    price: number
    description?: string
    category?: string
    url?: string
    image_url?: string
  }[]
  customerId?: string
  anonymousId?: string
  email?: string
  isNewCustomer?: boolean
  loyaltyStatus?: string
  firstName?: string
  lastName?: string
  name?: string
  age?: number
  birthday?: string
  friendbuyAttributes?: {
    [k: string]: unknown
  }
  pageUrl?: string
  pageTitle?: string
  userAgent?: string
  ipAddress?: string
}
