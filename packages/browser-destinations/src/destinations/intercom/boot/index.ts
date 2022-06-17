import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import { Intercom } from '../api'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, Intercom, Payload> = {
  title: 'Boot',
  description: '',
  platform: 'web',
  fields: {
    userId: {
      type: 'string',
      required: false,
      description: "The user's identity",
      label: 'Identity',
      default: {
        '@path': '$.userId'
      }
    },
    traits: {
      type: 'object',
      required: false,
      description: 'The Segment traits to be forwarded to Intercom',
      label: 'Traits',
      default: {
        '@path': '$.traits'
      }
    }
  },
  perform: (Intercom, event) => {
    // Invoke Partner SDK here
    console.log(Intercom)
    console.log(event.context.event)
  }
}

export default action
