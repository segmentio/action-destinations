import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { PendoSDK, PendoOptions } from '../types'

const action: BrowserActionDefinition<Settings, PendoSDK, Payload> = {
  title: 'Send Identify Event',
  description: 'Send Segment identify() events to Pendo',
  defaultSubscription: 'type="identify"',
  platform: 'web',
  fields: {
    visitorId: {
      label: 'Visitor ID',
      description: 'Pendo Visitor ID. Maps to Segment userId',
      type: 'string',
      required: true,
      default: {
        '@path': '$.userId'
      },
      readOnly: true
    },
    visitorData: {
      label: 'Visitor Metadata',
      description: 'Additional Visitor data to send',
      type: 'object',
      default: {
        '@path': '$.traits'
      },
      readOnly: false
    },
    accountId: {
      label: 'Account ID',
      description:
        'Pendo Account ID. Maps to Segment groupId.  Note: If you plan to change this, enable the setting "Use custom Segment group trait for Pendo account id"',
      type: 'string',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.context.groupId' },
          then: { '@path': '$.context.groupId' },
          else: { '@path': '$.groupId' }
        }
      },
      readOnly: false
    }
  },
  perform: (pendo, event) => {
    const payload: PendoOptions = {
      visitor: {
        ...event.payload.visitorData,
        id: event.payload.visitorId
      }
    }

    const analyticsGroupId = typeof event.analytics?.group === 'function' ? event.analytics.group()?.id() : undefined
    if (event.payload.accountId) {
      payload['account'] = { id: event.payload.accountId }
    } else if (analyticsGroupId && !event.settings.disableGroupIdAndTraitsOnLoad) {
      payload['account'] = { id: analyticsGroupId }
    }

    pendo.identify(payload)
  }
}

export default action
