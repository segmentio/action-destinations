export interface RedditPixel {
  page: () => void
  init: (pixelId: string, ldu?: any) => void
  track: (eventName: string, eventMetadata?: any) => void
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
