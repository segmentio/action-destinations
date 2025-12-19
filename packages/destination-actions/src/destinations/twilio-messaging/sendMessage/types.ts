import { PREDEFINED_CONTENT_TYPES, CHANNELS, SENDER_TYPE } from './constants'

export type TwilioPayload = {
  To: string
  ValidityPeriod?: number
  MediaUrl?: string[]
  Tags?: string
} & Sender &
  Content

export type Schedule = {
  SendAt: string // iso8601 timestamp
  ScheduleType: 'fixed'
}

export type Sender = FromPhone | FromMessagingService

type FromMessagingService = {
  MessagingServiceSid: string
  Schedule?: Schedule
}

type FromPhone = {
  From: string
}

export type Content = ContentTemplateMessage | InlineMessage

type ContentTemplateMessage = {
  ContentSid: string
  ContentVariables?: string
}

type InlineMessage = {
  Body: string
}

export type PredefinedContentTypes = {
  [key: string]: PredefinedContentTypeItem
}

export type Channel = typeof CHANNELS[keyof typeof CHANNELS]

export type PredefinedContentTypeItem = {
  friendly_name: string
  name: string
  supports_media: boolean
  supported_channels: Array<Channel>
}

export type ContentTypeName = typeof PREDEFINED_CONTENT_TYPES[keyof typeof PREDEFINED_CONTENT_TYPES]['name']

export type SenderType = typeof SENDER_TYPE[keyof typeof SENDER_TYPE]
