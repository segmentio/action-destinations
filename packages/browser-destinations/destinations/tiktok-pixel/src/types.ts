export interface TikTokPixel {
  identify: ({
    sha256_email,
    sha256_phone_number
  }: {
    sha256_email: string | undefined
    sha256_phone_number: string | undefined
  }) => void
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
