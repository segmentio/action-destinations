import { PREDEFINED_MESSAGE_TYPES } from './constants'

export type TWILIO_PAYLOAD = {
  To: string
  SendAt?: string
  ValidityPeriod?: number
  MediaUrl?: string[]
} & Sender & MessageType

export type Sender = FromPhone | FromMessagingService

type FromMessagingService = {
    MessagingServiceSid: string
}

type FromPhone = {
    From: string
}

export type MessageType = ContentTemplateMessage | InlineMessage

type ContentTemplateMessage = {
    ContentSid: string
    ContentVariables?: string
}
   
type InlineMessage = {
    Body: string
}

export type MessageTypeName = typeof PREDEFINED_MESSAGE_TYPES[keyof typeof PREDEFINED_MESSAGE_TYPES]['name']
