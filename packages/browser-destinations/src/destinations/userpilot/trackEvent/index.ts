import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { Userpilot } from '../types'

const action: BrowserActionDefinition<Settings, Userpilot, Payload> = {
  title: 'Track Event',
  description:
    "Send an event to Userpilot. It's mandatory to identify a user by calling identify() prior to invoking other methods such as track(). You can learn more by visiting the [Userpilot documentation](https://docs.userpilot.com/article/23-identify-users-track-custom-events).",
  platform: 'web',
  defaultSubscription: 'type = "track"',
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
