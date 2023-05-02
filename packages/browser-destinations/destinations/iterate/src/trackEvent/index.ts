import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { Iterate as IterateClient, Command } from '../types'

const action: BrowserActionDefinition<Settings, IterateClient, Payload> = {
  title: 'Track Event',
  description: 'Track events',
  platform: 'web',
  defaultSubscription: 'type = "track"',
  fields: {
    name: {
      description: 'The name of the event.',
      label: 'Name',
      required: true,
      type: 'string',
      default: {
        '@path': '$.event'
      }
    }
  },
  perform: (Iterate, event) => {
    Iterate(Command.Event, event.payload.name)
  }
}

export default action
