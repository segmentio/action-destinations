export interface Payload {
  userId?: string
  anonymousId?: string
  traits?: {
    [k: string]: unknown
  }
}
