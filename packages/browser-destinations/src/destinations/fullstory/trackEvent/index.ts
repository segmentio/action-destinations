import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import * as FullStory from '@fullstory/browser'
// import { IntegrationError } from '@segment/actions-core'

const action: BrowserActionDefinition<Settings, typeof FullStory, Payload> = {
  title: 'Track Event',
  description: 'Track events',
  platform: 'web',
  defaultSubscription: 'type = "track"',
  fields: {
    eventName: {
      description: 'The name of the event.',
      label: 'name',
      required: true,
      type: 'string'
    },
    eventProperties: {
      description: 'A JSON object containing additional information about the event that will be indexed by FullStory.',
      label: 'properties',
      required: false,
      type: 'object'
    }
  },
  perform: (client, event) => {
    client.event(event.payload.eventName, event.payload.eventProperties ?? {})
  }
}

export default action
