export type LaunchpadEventProperties = {
  anonymous_id?: string // 'anon-2134'
  browser_version?: string // '9.0'
  browser?: string // 'Mobile Safari'
  current_url?: string // 'https?://segment.com/academy/'
  device?: string // 'maguro'
  group_id?: string // 'groupId123'
  identified_id?: string // 'user1234'
  messageId?: string // '859d3955-363f-590a-9aa4-b4f49b582437'
  ip?: string | unknown // '192.168.1.1'
  os_version?: string // '8.1.3'
  os?: string // 'iPhone OS'
  referrer?: string
  user_id?: string
  source: string // 'segment'
  distinct_id: string | undefined // 'test_segment_user'
  id?: string | null // this is just to maintain backwards compatibility  with the classic segment integration, I'm not completely sure what the purpose of this was.
  segment_source_name?: string // 'readme'
  time?: string | number | undefined
  properties?: [k: string] | unknown //event props
  traits?: [k: string] | unknown
  context?: [k: string] | unknown
}

export type LaunchpadEvent = {
  event?: string
  properties?: LaunchpadEventProperties
  api_key: string
}
