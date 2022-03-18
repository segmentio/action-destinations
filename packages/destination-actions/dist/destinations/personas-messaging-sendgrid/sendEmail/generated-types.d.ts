export interface Payload {
  send?: boolean
  userId: string
  toEmail?: string
  fromDomain?: string | null
  fromEmail: string
  fromName: string
  replyToEqualsFrom?: boolean
  replyToEmail: string
  replyToName: string
  bcc: string
  previewText?: string
  subject: string
  body?: string
  bodyUrl?: string
  bodyType: string
  bodyHtml?: string
  externalIds?: {
    id?: string
    type?: string
    subscriptionStatus?: string
  }[]
  customArgs?: {
    [k: string]: unknown
  }
}
