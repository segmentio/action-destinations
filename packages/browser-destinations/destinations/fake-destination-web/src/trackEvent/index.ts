import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { FakeClient } from '../types'

const action: BrowserActionDefinition<Settings, FakeClient, Payload> = {
  title: 'Track Event',
  description: 'Send a track event to Fake Destination.',
  defaultSubscription: 'type = "track"',
  platform: 'web',
  fields: {
    event: {
      type: 'string',
      required: true,
      description: 'The event name.',
      label: 'Event Name',
      default: { '@path': '$.event' }
    },
    properties: {
      type: 'object',
      required: false,
      description: 'Properties to send with the event.',
      label: 'Event Properties',
      default: { '@path': '$.properties' },
      defaultObjectUI: 'object'
    }
  },
  perform: (client, { payload }) => {
    if (payload?.event) {
      client.track(payload.event, payload.properties)
    }
  }
}

export default action
