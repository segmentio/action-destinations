export interface Payload {
  eventType: string
  eventProperties: {
    [k: string]: unknown
  }
  deduplicationId?: string
  customerId: string
  anonymousId?: string
  email: string
  pageUrl?: string
  pageTitle?: string
  userAgent?: string
  ipAddress?: string
}
