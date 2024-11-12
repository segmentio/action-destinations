export interface IterableSubscribePayload {
  listId: number
  subscribers: Array<Subscriber>
  updateExistingUsersOnly?: boolean
}

export interface Subscriber {
  email?: string
  dataFields?: Record<string, null | boolean | string | number | object>
  userId?: string
  preferUserId?: boolean
}

export interface IterableUnsubscribePayload {
  listId: number
  subscribers: Array<Unsubscriber>
  campaignId?: string
  channelUnsubscribe?: boolean
}

export interface Unsubscriber {
  email?: string
  userId?: string
}

export interface GetAudienceResp {
  lists: {
    id: number
    name: string
  }[]
}
