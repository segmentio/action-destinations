export interface Payload {
  type?: string
  eventName?: string
  properties?: {
    [k: string]: unknown
  }
  userId?: string
}
