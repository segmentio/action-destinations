import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { Appcues } from '../types'

const action: BrowserActionDefinition<Settings, Appcues, Payload> = {
  title: 'Track',
  description: 'Send Segment track events to Appcues.',
  platform: 'web',
  fields: {
    event: {
      label: 'Event Name',
      description: 'The name of the event to track in Appcues.',
      required: true,
      type: 'string',
      default: { '@path': '$.event' }
    },
    properties: {
      label: 'Event Properties',
      description: 'Properties to associate with the event.',
      required: false,
      type: 'object',
      default: { '@path': '$.properties' }
    }
  },
  defaultSubscription: 'type = "track"',
  perform: (appcues, { payload }) => {
    const { event, properties } = payload
    appcues.track(event, properties)
  }
}

export default action
