import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { Userpilot } from '../types'

const action: BrowserActionDefinition<Settings, Userpilot, Payload> = {
  title: 'Track Event',
  description:
    'Send an event to Userpilot, you can visit [Userpilot docs](https://docs.userpilot.com/article/23-identify-users-track-custom-events) for more information.',
  platform: 'web',
  fields: {
    name: {
      type: 'string',
      required: true,
      description: 'Event name',
      label: 'Name',
      default: {
        '@path': '$.event'
      }
    },
    properties: {
      type: 'object',
      required: false,
      description: 'Event properties',
      label: 'Properties',
      default: {
        '@path': '$.properties'
      }
    }
  },
  perform: (_, event) => {
    window.userpilot.track(event.payload.name, event.payload.properties ?? {})
  }
}

export default action
