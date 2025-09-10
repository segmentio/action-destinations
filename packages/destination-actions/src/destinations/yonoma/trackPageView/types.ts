

export interface TrackPageEventJSON {
  url: string
  title?: string
  referrer?: string
  userId?: string
  anonymousId?: string
  email?: string
  listId: string
  properties?: {
    [key: string]: unknown
  },
  timestamp?: string | number
}