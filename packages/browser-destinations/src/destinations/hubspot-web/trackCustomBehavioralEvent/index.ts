import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { Hubspot } from '../types'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, Hubspot, Payload> = {
  title: 'Track Custom Behavioral Event',
  description:
    'Using custom behavioral events, you can tie event completions to contacts records and populate event properties with metadata about the event.',
  platform: 'web',
  defaultSubscription: 'type = "track"',
  fields: {
    name: {
      description: 'The event_id or internal name of the event that you created in HubSpot.',
      label: 'Event Name',
      type: 'string',
      required: true,
      default: {
        '@path': '$.event'
      }
    },
    properties: {
      description: 'A list of key-value pairs, with one key-value pair per property.',
      label: 'Event Properties',
      type: 'object',
      required: false,
      default: {
        '@path': '$.properties'
      }
    }
  },
  perform: (_hsq, event) => {
    _hsq.push(['trackCustomBehavioralEvent', { ...event.payload }])
  }
}

export default action
