export interface Payload {
  ts?: string
  profileData?: {
    [k: string]: unknown
  }
  identity: string
}
