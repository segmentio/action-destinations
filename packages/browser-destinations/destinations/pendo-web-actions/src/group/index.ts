import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { PendoSDK, identifyPayload } from '../types'

const action: BrowserActionDefinition<Settings, PendoSDK, Payload> = {
  title: 'Send Group Event',
  description: 'Send Segment group() events to Pendo',
  defaultSubscription: 'type="group"',
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
    accountId: {
      label: 'Account ID',
      description: 'Pendo Account ID. This overrides the Pendo Account ID setting',
      type: 'string',
      required: true,
      default: { '@path': '$.groupId' }
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
        id: event.payload.visitorId
      }
    }
    if (event.payload.accountId || event.settings.accountId) {
      payload.account = {
        id: event.payload.accountId ?? (event.settings.accountId as string),
        ...event.payload.accountData
      }
    }

    pendo.identify(payload)
  }
}

export default action
