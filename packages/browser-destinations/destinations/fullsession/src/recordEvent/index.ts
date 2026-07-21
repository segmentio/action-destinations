import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { FUS, CustomEventData } from '../types'

const action: BrowserActionDefinition<Settings, FUS, Payload> = {
  title: 'Track Event',
  description: 'Track custom events and user interactions in FullSession for behavioral analysis.',
  platform: 'web',
  defaultSubscription: 'type = "track"',
  fields: {
    name: {
      description: 'The name of the event being tracked.',
      label: 'Event Name',
      required: true,
      type: 'string',
      default: {
        '@path': '$.event'
      }
    },
    properties: {
      description: 'Additional properties and metadata associated with the event.',
      label: 'Event Properties',
      required: false,
      type: 'object',
      default: {
        '@path': '$.properties'
      }
    }
  },
  perform: (FUS, data) => {
    const { name, properties } = data.payload
    FUS.event(name, (properties ?? {}) as CustomEventData)
  }
}

export default action
