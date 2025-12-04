import { UserProperties, ParsedUA, UserAgentData } from '../types'

export interface AmplitudeProfileJSON {
  user_id?: string | null
  device_id?: string
  user_properties?: UserProperties
  groups?: Record<string, unknown>
  app_version?: string
  platform?: string
  device_brand?: string
  carrier?: string
  country?: string
  region?: string
  city?: string
  dma?: string
  language?: string
  paying?: boolean
  start_version?: string
  insert_id?: string
  user_agent?: ParsedUA | string
  userAgentData?: UserAgentData
  library?: string
}