export interface UpsertUserPayload {
  listId?: number
  action?: 'subscribe' | 'usubscribe'
  email?: string
  userId?: string
  dataFields?: {
    [k: string]: unknown
  }
  preferUserId: boolean
  mergeNestedObjects: boolean
}
