export interface RedditPixel {
  page: () => void
  // instance: (pixel_id: string) => RedditPixel
  track: string
  advanced_matching: ({
    email,
    externalId,
    aaid,
    idfa
  }: {
    email: string | undefined
    externalId: string | undefined
    aaid: string | undefined
    idfa: string | undefined
  }) => void
  metadata: ({
    itemCount,
    value,
    currency,
    conversionId,
    products
  }: {
    itemCount: number | undefined
    value: number | undefined
    currency: string | undefined
    conversionId: string | undefined
    products:
      | {
          id: string | undefined
          category: string | undefined
          name: string | undefined
        }[]
      | undefined
  }) => void
}
