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
  tracking_settings?: {
    subscription_tracking?: {
      enable: boolean
      text?: string
      html?: string
      substitution_tag?: string
    }
    ganalytics?: {
      enable: boolean
      utm_source?: string
      utm_medium?: string
      utm_term?: string
      utm_content?: string
      utm_campaign?: string
    }
  }
  mail_settings?: {
    sandbox_mode?: boolean
  }
}
