export type vwoPayload = {
  d: {
    msgId: string
    visId: string
    event: {
      props: {
        vwo_og_event?: string
        page: {
          [k: string]: unknown
        }
        [k: string]: unknown
        isCustomEvent?: boolean
        vwoMeta: {
          source: string
          ogName?: string
          [k: string]: unknown
        }
      }
      name: string
      time: number
    }
    visitor?: {
      [k: string]: unknown
    }
    sessionId: number
  }
}

export type commonPayload = {
  properties?: {
    [k: string]: unknown
  }
  attributes?: {
    [k: string]: unknown
  }
  vwoUuid: string
  page: {
    [k: string]: unknown
  }
  ip?: string
  userAgent: string
  timestamp: string
}
