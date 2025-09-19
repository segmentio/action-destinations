

export interface UpsertContactJSON {
  userId?: string
  anonymousId?: string
  email?: string
  listId: string
  status?: boolean,
  properties: {
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