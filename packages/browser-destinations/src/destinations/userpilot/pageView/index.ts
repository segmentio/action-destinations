import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { Userpilot } from '../types'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, Userpilot, Payload> = {
  title: 'Page View',
  description: 'Update the content to trigger on page view.',
  platform: 'web',
  fields: {
    name: {
      type: 'string',
      required: false,
      description: 'The name of the page that was viewed.',
      label: 'Page Name',
      default: {
        '@path': '$.name'
      }
    },
    properties: {
      type: 'object',
      required: false,
      description: 'The properties of the page that was viewed.',
      label: 'Properties',
      default: {
        '@path': '$.properties'
      }
    }
  },
  perform: (_, event) => {
    window.userpilot.reload(event.payload.name ?? '', event.payload.properties ?? {})
  }
}

export default action
