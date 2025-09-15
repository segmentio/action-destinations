interface EmailDetails {
  email: string
  name: string | undefined
}

interface StringObject {
  [key: string]: string
}

export interface SendEmailReq {
  domain?: string
  personalizations: [
    {
      to: EmailDetails[]
      cc?: EmailDetails[]
      bcc?: EmailDetails[]
      headers?: StringObject
      dynamic_template_data?: {
        [k: string]: unknown
      }
      custom_args?: StringObject
      send_at?: number
    }
  ]
  from: EmailDetails
  reply_to?: EmailDetails
  template_id: string
  categories?: string[]
  asm?: {
    group_id: number
  }
  ip_pool_name?: string
}
