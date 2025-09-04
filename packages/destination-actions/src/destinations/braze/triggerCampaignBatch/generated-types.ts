// Generated file. DO NOT MODIFY IT BY HAND.

export interface Settings {
  endpoint: string
  app_id: string
  api_key: string
}

export interface Payload {
  campaign_id: string
  recipients?: {
    external_user_id?: string
    user_alias?: {
      alias_name: string
      alias_label: string
    }
    trigger_properties?: Record<string, any>
    send_to_existing_only?: boolean
    attributes?: Record<string, any>
  }[]
  broadcast?: boolean
  audience?: {
    and?: Array<Record<string, any>>
    or?: Array<Record<string, any>>
  }
  trigger_properties?: Record<string, any>
  schedule?: {
    time: string
    in_local_time?: boolean
  }
}
