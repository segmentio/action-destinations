export interface Payload {
  eventName: string
  eventProperties?: {
    [k: string]: unknown
  }
}
