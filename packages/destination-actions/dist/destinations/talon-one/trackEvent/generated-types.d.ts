export interface Payload {
  customerProfileId: string
  eventType: string
  type: string
  attributes?: {
    [k: string]: unknown
  }
}
