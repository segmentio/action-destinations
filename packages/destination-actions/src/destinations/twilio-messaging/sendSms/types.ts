import { PREDEFINED_CONTENT_TYPES, CHANNELS } from './constants'

export type TwilioPayload = {
  To: string
  SendAt?: string
  ValidityPeriod?: number
  MediaUrl?: string[]
} & Sender &
  Content

export type Sender = FromPhone | FromMessagingService

type FromMessagingService = {
  MessagingServiceSid: string
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
