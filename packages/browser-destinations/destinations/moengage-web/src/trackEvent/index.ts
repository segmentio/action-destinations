import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { MoengageSDK } from '../types'

const action: BrowserActionDefinition<Settings, MoengageSDK, Payload> = {
  title: 'Track Event',
  description: 'Send Segment track events to Moengage.',
  defaultSubscription: 'type = "track"',
  platform: 'web',
  fields: {
    event_name: {
      label: 'Event Name',
      description: 'The name of the event to be tracked in Moengage.',
      type: 'string',
      required: true,
      default: { '@path': '$.event' }
    },
    attributes: {
      label: 'Attributes',
      description: 'A dictionary of key-value pairs that will be sent as event attributes to Moengage.',
      type: 'object',
      required: false, 
      default: { '@path': '$.properties' }
    }
  },
  perform: (client, { payload }) => {
    const { 
      event_name, 
      attributes 
    } = payload
    return client.track_event(event_name, attributes || {})
  }
}

export default action
