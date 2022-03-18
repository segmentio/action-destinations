export interface Payload {
  userId?: string
  anonymousId?: string
  displayName?: string
  email?: string
  traits?: {
    [k: string]: unknown
  }
}
