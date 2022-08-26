import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { Hubspot } from '../types'

const action: BrowserActionDefinition<Settings, Hubspot, Payload> = {
  title: 'Update an Existing Contact or Create a New One',
  description: 'Use this action to identify website visitors and contacts.',
  defaultSubscription: 'type = "identify"',
  platform: 'web',
  fields: {
    email: {
      description:
        'Identify a visitor by email address when you want to update an existing contact or create a new one.',
      label: 'Email Address',
      type: 'string',
      required: false,
      default: {
        '@path': '$.traits.email'
      }
    },
    id: {
      description: 'a custom external ID that identifies the visitor.',
      label: 'Unique external ID',
      type: 'string',
      required: false,
      default: {
        '@path': '$.userId'
      }
    },
    custom_properties: {
      description: 'A list of key-value pairs, with one key-value pair per property.',
      label: 'Custom Properties',
      type: 'object',
      required: false,
      default: {
        '@path': '$.traits'
      }
    }
  },
  perform: (_hsq, event) => {
    const payload = event.payload
    if (!payload.email && !payload.id) {
      return
    }
    _hsq.push(['identify', { ...payload.custom_properties, email: payload.email, id: payload.id }])

    if (event.settings.flushIdentifyImmediately) {
      _hsq.push(['trackPageView'])
    }
  }
}

export default action
