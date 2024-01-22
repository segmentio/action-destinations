import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { Survicate } from 'src/types'

const action: BrowserActionDefinition<Settings, Survicate, Payload> = {
  title: 'Track Event',
  description: 'Invoke survey with Segment Track event',
  platform: 'web',
  defaultSubscription: 'type = "track"',
  fields: {
    name: {
      description: 'The event name',
      label: 'Event name',
      required: true,
      type: 'string',
      default: {
        '@path': '$.event'
      }
    },
    properties: {
      type: 'object',
      required: false,
      description: 'Object containing the properties of the event',
      label: 'Event Properties',
      default: {
        '@path': '$.properties'
      }
    }
  },
  perform: (_, { payload: { name, properties } }) => {
    const segmentProperties = properties || {}
    window._sva.invokeEvent(`segmentEvent-${name}`, segmentProperties)
  }
}

export default action
