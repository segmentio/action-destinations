

export interface TrackEventJSON {
  event: string
  userId: string
  anonymousId?: string
  email: string
  listId: string
  timestamp?: string
  ip?: string
  userAgent?: string
  page?: {
    url?: string
    title?: string
    referrer?: string
    path?: string
    search?: string
  }
  campaign?: {
    name?: string
    source?: string
    medium?: string
    term?: string
    content?: string
  }
  location?: {
    country?: string
    region?: string
    city?: string
  }
  properties?: {
    [key: string]: unknown
  }


}