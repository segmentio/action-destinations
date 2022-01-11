import type { InputField } from '@segment/actions-core'
import { FriendbuyPayloadItem } from './util'

// The context fields are used by the cloud destination.  They are not needed
// by the browser destination because the Friendbuy API adds them to the
// request itself.
export const contextFields: Record<string, InputField> = {
  pageUrl: {
    label: 'Page URL',
    description: 'The URL of the web page the event was generated on.',
    type: 'string',
    format: 'uri',
    required: false,
    default: { '@path': '$.context.page.url' }
  },
  pageTitle: {
    label: 'Page Title',
    description: 'The title of the web page the event was generated on.',
    type: 'string',
    required: false,
    default: { '@path': '$.context.page.title' }
  },
  userAgent: {
    label: 'User Agent',
    description: "The browser's User-Agent string.",
    type: 'string',
    required: false,
    default: { '@path': '$.context.userAgent' }
  },
  ipAddress: {
    label: 'IP Address',
    description: "The users's IP address.",
    type: 'string',
    required: false,
    default: { '@path': '$.context.ip' }
  }
}

export interface ContextFields {
  pageUrl?: string
  pageTitle?: string
  userAgent?: string
  ipAddress?: string
}

export function contextAttributes(context: ContextFields): FriendbuyPayloadItem[] {
  return [
    ['pageUrl', context.pageUrl],
    ['pageTitle', context.pageTitle],
    ['userAgent', context.userAgent],
    ['ipAddress', context.ipAddress]
  ]
}
