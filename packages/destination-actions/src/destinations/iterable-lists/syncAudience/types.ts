export interface SubscribePayload {
  listId: number
  subscribers: Array<Subscriber>
  updateExistingUsersOnly?: boolean
}

export interface Subscriber {
  email?: string
  dataFields?: { [key: string]: unknown }
  userId?: string
  preferUserId?: boolean
}

export interface UnsubscribePayload {
  listId: number
  subscribers: Array<Unsubscriber>
  campaignId?: number
  channelUnsubscribe?: boolean
}

export interface Unsubscriber {
  email?: string
  userId?: string
}