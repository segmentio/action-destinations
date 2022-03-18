export interface Payload {
  eventType: string
  eventProperties: {
    [k: string]: unknown
  }
  deduplicationId?: string
  customerId: string
  anonymousId?: string
  email?: string
}
