// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  id: string
  occurredAt: string | number
  opaqueUserId: string
  /**
   * The list of products viewed. Each product is a promotable entity.
   */
  products: {
    id: string
    resolvedBidId: string
    additionalAttribution: {
      [k: string]: unknown
    }
  }[]
}
