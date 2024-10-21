export interface sendEmailReq {
  personalizations: [
    {
      from: {
        email: string
        name: string | undefined
      }
      to: {
        email: string
        name: string | undefined
      }[]
      cc?: {
        email: string
        name: string | undefined
      }[]
      bcc?: {
        email: string
        name?: string
      }[]
      subject: string
      headers?: {
        [key: string]: string
      }
      dynamic_template_data?: {
        [key: string]: string
      }
      custom_args?: {
        [key: string]: string
      }
      send_at?: number
    }
  ]
  reply_to?: {
    email: string
    name?: string
  }
  template_id: string
  categories?: string[]
  asm?: {
    group_id: number
  }
  ip_pool_name?: string
  tracking_settings?: {
    click_tracking?: {
      enable: boolean
      enable_text?: boolean
    }
    open_tracking?: {
      enable: boolean
      substitution_tag?: string
    }
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
    bypass_list_management?: boolean
    bypass_unsubscribe_management?: boolean
    sandbox_mode?: boolean
  }
}
