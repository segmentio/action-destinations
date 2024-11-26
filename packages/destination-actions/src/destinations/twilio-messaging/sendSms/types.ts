
export type SMS_PAYLOAD = {
  To: string
  SendAt?: string
  ValidityPeriod?: number
} 
| (Sender & InlineTemplate) 
| (Sender & InlineTemplate & MediaMessage) 
| (Sender & MediaMessage) 
| (Sender & PredefinedTemplate) 
| (Sender & PredefinedTemplate & MediaMessage)

type Sender = FromPhone | FromMessagingService

type FromMessagingService = {
    MessagingServiceSid: string
}

type FromPhone = {
    From: string
}

type PredefinedTemplate = {
    ContentSid: string
    ContentVariables?: Record<string, string>
}
   
type InlineTemplate = {
    Body: string
}

type MediaMessage = {
    MediaUrl: string[]
}