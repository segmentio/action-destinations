

export interface SendEventJSON {
  event: string
  userId?: string
  email?: string
  listId: string
  properties?: {
    [key: string]: unknown
  },
  timestamp?: string | number
}