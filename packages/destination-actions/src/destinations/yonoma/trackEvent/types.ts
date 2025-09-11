

export interface TrackEventJSON {
  event: string
  userId?: string
  anonymousId?: string
  email?: string
  listId: string
  properties?: {
    [key: string]: unknown
  },
  timestamp?: string | number
}