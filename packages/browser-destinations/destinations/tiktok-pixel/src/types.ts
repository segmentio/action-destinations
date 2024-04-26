export interface TikTokPixel {
  page: () => void
  identify: ({
    email,
    phone_number,
    external_id
  }: {
    email: string | undefined
    phone_number: string | undefined
    external_id: string | undefined
  }) => void
  track: (
    event: string,
    {
      contents,
      content_type,
      currency,
      value,
      description,
      query,
      order_id,
      shop_id
    }: {
      contents:
        | {
            price?: number | undefined
            quantity?: number | undefined
            content_category?: string | undefined
            content_id?: string | undefined
            content_name?: string | undefined
            brand?: string | undefined
          }[]
        | []
      content_type: string | undefined
      currency: string | undefined
      value: number | undefined
      description: string | undefined
      query: string | undefined
      order_id: string | undefined
      shop_id: string | undefined
    },
    {
      event_id
    }: {
      event_id: string | undefined
    }
  ) => void
}
