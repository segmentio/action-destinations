export interface Payload {
  userId: string
  toNumber?: string
  from: string
  body: string
  customArgs?: {
    [k: string]: unknown
  }
  connectionOverrides?: string
  send?: boolean
  externalIds?: {
    id?: string
    type?: string
    subscriptionStatus?: string
  }[]
}
