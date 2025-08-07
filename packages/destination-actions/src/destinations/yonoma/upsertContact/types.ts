

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
  }
}

export interface UpdateTagsJSON {
  userId?: string
  email?: string
  listId: string
  tags: string[]
}