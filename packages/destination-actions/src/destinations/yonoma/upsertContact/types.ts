export interface UpsertContactJSON {
  userId: string
  anonymousId?: string
  email: string
  listId: string
  status: boolean
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
    firstName?: string
    lastName?: string
    phone?: string
    dateOfBirth?: string
    address?: string
    city?: string
    state?: string
    country?: string
    zipcode?: string
    tags_to_add?: string[]
    tags_to_remove?: string[]
  }
}
