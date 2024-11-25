
export type SMS_PAYLOAD = {
  To: string
  SendAt?: string
  ValidityPeriod?: number
} & (Sender & Template)

type Sender = FromPhone | FromMessagingService

type Template = InlineTemplate | PredefinedTemplate

export type PredefinedTemplate = {
    ContentSid: string
    ContentVariables: Record<string, string>
}
   
export type InlineTemplate = {
    Body: string
}

export type FromMessagingService = {
    MessagingServiceSid: string
}

export type FromPhone = {
    From: string
}