export interface ChannelDetails {
  id: number
  name: string
  messageMedium: string
  channelType: string
}

export interface MessageTypeDetails {
  id: number
  name: string
  channelId: number
  subscriptionPolicy: string
}

export interface ListDetails {
  id: number
  name: string
  listType: string
}

export interface ResolvedIdentifier {
  email?: string
  userId?: string
}

export interface DynamicFieldContext {
  selectedArrayIndex?: number
  selectedKey?: string
  query?: string
}

export interface ChannelsResponse {
  channels: ChannelDetails[]
}

export interface MessageTypesResponse {
  messageTypes: MessageTypeDetails[]
}

export interface ListsResponse {
  lists: ListDetails[]
}

export interface BulkSubscriptionRequestBody {
  users?: string[]
  usersByUserId?: string[]
}
