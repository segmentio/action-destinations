export interface Payload {
  attributes?: {
    [k: string]: unknown
  }
  customerProfileId: string
  deleteAudienceIDs?: number[]
  addAudienceIDs?: number[]
  runRuleEngine?: boolean
}
