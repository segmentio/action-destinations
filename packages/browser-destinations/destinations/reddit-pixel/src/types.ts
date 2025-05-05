export interface RedditPixel {
  page: () => void
  init: (
    pixelId: string,
    ldu?: {
      dpm?: string
      dpcc?: string
      dprc?: string
    }
  ) => void
  track: (
    eventName: string,
    eventMetadata?: {
      currency?: string
      itemCount?: number
      value?: number
      customEventName?: string
      conversionId?: string
      aaid?: string
      idfa?: string
      email?: string
      phoneNumber?: string
      externalId?: string
      products?: {
        id?: string | undefined
        category?: string | undefined
        name?: string | undefined
      }[]
    }
  ) => void
}
