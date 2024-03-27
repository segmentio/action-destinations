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
    }
  },
  perform: (pendo, event) => {
    const payload: PendoOptions = {
      visitor: {
        ...event.payload.visitorData,
        id: event.payload.visitorId
      }
    }

    pendo.identify(payload)
  }
}

export default action
