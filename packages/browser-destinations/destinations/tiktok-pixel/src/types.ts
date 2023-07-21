export interface TikTokPixel {
  page: () => void
  identify: ({ email, phone_number }: { email: string | undefined; phone_number: string | undefined }) => void
  track: (
    event: string,
    {
      contents,
      currency,
      value,
      description,
      query
    }: {
      contents:
        | {
            price?: number
            quantity?: number
            content_type?: string
            content_id?: string
          }[]
        | []
      currency: string
      value: number
      description: string | undefined
      query: string | undefined
    }
  ) => void
}
