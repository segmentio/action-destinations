import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import * as FullStory from '@fullstory/browser'

const action: BrowserActionDefinition<Settings, typeof FullStory, Payload> = {
  title: 'Event',
  description: 'Track events',
  platform: 'web',
  defaultSubscription: 'type = "track"',
  fields: {
    name: {
      description: 'The name of the event to be tracked',
      label: 'name',
      required: true,
      type: 'string'
    },
    properties: {
      description: 'A propeties object containing a payload',
      label: 'properties',
      required: false,
      type: 'object'
    }
  },
  perform: (client, event) => {
    client.event(event.payload.name, event.payload.properties ?? {})
  }
}

export default action
