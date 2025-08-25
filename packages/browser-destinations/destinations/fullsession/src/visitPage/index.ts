import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { FUS } from '../types'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, FUS, Payload> = {
  title: 'Visit Page',
  description: 'set properties for visited page',
  defaultSubscription: 'type = "page"',
  platform: 'web',
  fields: {
    name: {
      type: 'string',
      required: false,
      description: 'the page visited',
      label: 'Page Name',
      default: {
        '@if': {
          exists: { '@path': '$.category' },
          then: { '@path': '$.category' },
          else: { '@path': '$.name' }
        }
      }
    },
    properties: {
      type: 'object',
      required: false,
      description: 'properties associated with the page visited',
      label: 'Properties',
      default: {
        '@path': '$.properties'
      }
    }
  },
  perform: (FUS, data) => {
    const { name, properties } = data.payload
    FUS.setSessionAttributes({
      name,
      ...properties
    })
  }
}

export default action
