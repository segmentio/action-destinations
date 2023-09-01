import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { PendoSDK, identifyPayload } from '../types'

const action: BrowserActionDefinition<Settings, PendoSDK, Payload> = {
  title: 'Send Identify Event',
  description: 'Send Segment identify() events to Pendo',
  defaultSubscription: 'type="identify"',
  platform: 'web',
  fields: {
    visitorId: {
      label: 'Visitor ID',
      description: 'Pendo Visitor ID. Defaults to Segment userId',
      type: 'string',
      required: true,
      default: {
        '@path': '$.userId'
      }
    },
    visitorData: {
      label: 'Visitor Metadata',
      description: 'Additional Visitor data to send',
      type: 'object',
      default: {
        '@path': '$.traits'
      }
    },
    accountId: {
      label: 'Account ID',
      description: 'Pendo Account ID. This overrides the Pendo Account ID setting',
      type: 'string',
      required: false,
      default: {
        '@if': {
          exists: { '@path': '$.context.group_id' },
          then: { '@path': '$.context.group_id' },
          else: { '@path': '$.groupId' }
        }
      }
    },
    accountData: {
      label: 'Account Metadata',
      description: 'Additional Account data to send',
      type: 'object',
      required: false
    }
  },
  perform: (pendo, event) => {
    const payload: identifyPayload = {
      visitor: {
        id: event.payload.visitorId,
        ...event.payload.visitorData
      }
    }
    if (event.payload.accountId || event.settings.accountId) {
      payload.account = {
        id: (event.payload.accountId as string) ?? (event.settings.accountId as string),
        ...event.payload.accountData
      }
    }

    pendo.identify(payload)
  }
}

export default action
