import { JSONValue } from './json-object'
export declare type ID = string | null | undefined
declare type CompactMetricType = 'g' | 'c'
interface CompactMetric {
  m: string
  v: number
  k: CompactMetricType
  t: string[]
  e: number
}
export declare type Integrations = {
  All?: boolean
  [integration: string]: boolean | undefined
}
export declare type Options = {
  integrations?: Integrations
  anonymousId?: ID
  timestamp?: Date | string
  context?: AnalyticsContext
  traits?: object
  [key: string]: any
}
interface AnalyticsContext {
  page?: {
    path?: string
    referrer?: string
    search?: string
    title?: string
    url?: string
  }
  metrics?: CompactMetric[]
  userAgent?: string
  locale?: string
  library?: {
    name: string
    version: string
  }
  traits?: {
    crossDomainId: string
  }
  campaign?: {
    name: string
    term: string
    source: string
    medium: string
    content: string
  }
  referrer?: {
    btid?: string
    urid?: string
  }
  amp?: {
    id: string
  }
  [key: string]: any
}
export interface SegmentEvent {
  messageId?: string
  type: 'track' | 'page' | 'identify' | 'group' | 'alias' | 'screen' | 'delete'
  category?: string
  name?: string
  properties?: object & {
    [k: string]: JSONValue
  }
  traits?: object & {
    [k: string]: JSONValue
  }
  integrations?: Integrations
  context?: AnalyticsContext
  options?: Options
  userId?: ID
  anonymousId?: ID
  groupId?: ID
  previousId?: ID
  event?: string
  writeKey?: string
  receivedAt?: Date | string
  sentAt?: Date | string
  _metadata?: {
    failedInitializations?: unknown[]
    bundled?: string[]
    unbundledIntegrations?: string[]
    nodeVersion?: string
  }
  timestamp?: Date | string
}
export {}
