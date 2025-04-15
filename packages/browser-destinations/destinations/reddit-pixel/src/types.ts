export interface RedditPixel {
  // (method: string, eventName: string, metadata?: any): void // this works too
  page: () => void
  // instance: (pixel_id: string) => RedditPixel
  init: (pixelId: string, ldu?: any) => void
  track: (eventName: string, eventMetadata?: any) => void
  // don't need this anymore - merge with metadata
  advanced_matching: ({
    email,
    externalId,
    aaid,
    idfa,
    phoneNumber
  }: {
    email?: string | undefined
    externalId?: string | undefined
    aaid?: string | undefined
    idfa?: string | undefined
    phoneNumber?: string | undefined
  }) => void
  metadata: ({
    itemCount,
    value,
    currency,
    conversionId,
    products
  }: {
    itemCount?: number | undefined
    value?: number | undefined
    currency?: string | undefined
    conversionId?: string | undefined
    products?:
      | {
          id: string | undefined
          category: string | undefined
          name: string | undefined
        }[]
      | undefined
  }) => void
}
