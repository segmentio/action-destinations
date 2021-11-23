import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { Sprig } from '../types'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, Sprig, Payload> = {
  title: 'Track Event',
  description: 'Track event to potentially filter user studies (microsurveys) later, or trigger a study now.',
  platform: 'web',
  fields: {
    name: {
      description: "The event name that will be shown on Sprig's interface.",
      label: 'Event name',
      required: true,
      type: 'string',
      default: {
        '@path': '$.event'
      }
    }
  },
  perform: (Sprig, event) => {
    Sprig('track', event.payload.name)
  }
}

export default action
