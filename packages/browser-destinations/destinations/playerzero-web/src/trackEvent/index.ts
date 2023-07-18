import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import { PlayerZero } from '../types'
import type { Payload } from './generated-types'

const action: BrowserActionDefinition<Settings, PlayerZero, Payload> = {
  title: 'Track Event',
  description: 'Track events',
  platform: 'web',
  defaultSubscription: 'type = "track"',
  fields: {
    name: {
      description: 'The name of the event.',
      label: 'Event name',
      required: true,
      type: 'string',
      default: {
        '@path': '$.event'
      }
    },
    properties: {
      description: 'A JSON object containing more information about the event.',
      label: 'Properties',
      required: false,
      type: 'object',
      default: {
        '@path': '$.properties'
      }
    }
  },
  perform: (playerzero, event) => {
    playerzero.track(event.payload.name, event.payload.properties)
  }
}

export default action
