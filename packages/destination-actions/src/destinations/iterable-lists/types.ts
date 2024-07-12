export interface UpsertUserPayload {
  listId?: number
  action?: 'subscribe' | 'usubscribe'
  email?: string
  userId?: string
  dataFields: {
    [k: string]: unknown
  }
  preferUserId: boolean
  mergeNestedObjects: boolean
}

export interface RawData {
  traits: Record<string, unknown>
  properties: Record<string, unknown>
  context: Record<string, unknown>
}

export interface SingleUpdateRequestData {
  rawData: RawData
}
