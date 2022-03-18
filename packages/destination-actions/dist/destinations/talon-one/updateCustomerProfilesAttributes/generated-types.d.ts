export interface Payload {
  customerProfileId: string
  attributes?: {
    [k: string]: unknown
  }
  mutualAttributes?: {
    [k: string]: unknown
  }
}
