export interface TikTokPixel {
  page: () => void
  instance: (pixel_code: string) => TikTokPixel
  identify: ({
    email,
    phone_number,
    external_id,
    first_name,
    last_name,
    city,
    state,
    country,
    zip_code
  }: {
    email: string | undefined
    phone_number: string | undefined
    external_id: string | undefined
    first_name: string | undefined
    last_name: string | undefined
    city: string | undefined
    state: string | undefined
    country: string | undefined
    zip_code: string | undefined
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
