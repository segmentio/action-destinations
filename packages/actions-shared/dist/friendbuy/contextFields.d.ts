import type { InputField } from '@segment/actions-core'
import { FriendbuyPayloadItem } from './util'
export declare const contextFields: Record<string, InputField>
export interface ContextFields {
  pageUrl?: string
  pageTitle?: string
  userAgent?: string
  ipAddress?: string
}
export declare function contextAttributes(context: ContextFields): FriendbuyPayloadItem[]
