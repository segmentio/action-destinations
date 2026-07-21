export type BaseJSON = {
  environment: string
  timestamp: string | number
  distinct_id?: string
  anonymous_id?: string
  device_id?: string
}

export type EventJSON = BaseJSON & {
  event: string
  properties: Context & Record<string, unknown>
}

export type IdentifyJSON = BaseJSON & {
  traits: Context & Record<string, unknown>
}

export type Context = {
  /** String from client IP; `0` is used for server-side events to skip request IP (see custom function). */
  $ip?: string | number
  $url?: string
  $referer?: string
  $os?: string
  $user_agent?: string
  $utm_campaign?: string
  $utm_source?: string
  $utm_medium?: string
  $utm_term?: string
  $utm_content?: string
  $viewport?: string
  $lib?: string
  $lib_version?: string
}

export type AliasJSON = BaseJSON & {
  new_user_id: string
}
