export interface Payload {
  event: string
  properties?: {
    [k: string]: unknown
  }
}
