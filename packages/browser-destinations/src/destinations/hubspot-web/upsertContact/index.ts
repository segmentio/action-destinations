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
    },
    company: {
      description: 'The name of the company the visitor is associated with.',
      label: 'Company Name',
      type: 'string',
      required: false,
      default: {
        '@path': '$.traits.company.name'
      }
    },
    country: {
      description: 'The name of the country the visitor is associated with.',
      label: 'Country',
      type: 'string',
      required: false,
      default: {
        '@path': '$.traits.address.country'
      }
    },
    state: {
      description: 'The name of the state the visitor is associated with.',
      label: 'State',
      type: 'string',
      required: false,
      default: {
        '@path': '$.traits.address.state'
      }
    },
    city: {
      description: 'The name of the city the visitor is associated with.',
      label: 'City',
      type: 'string',
      required: false,
      default: {
        '@path': '$.traits.address.city'
      }
    },
    address: {
      description: 'The street address of the visitor.',
      label: 'Street Address',
      type: 'string',
      required: false,
      default: {
        '@path': '$.traits.address.street'
      }
    },
    zip: {
      description: 'The postal code of the visitor.',
      label: 'Postal Code',
      type: 'string',
      required: false,
      default: {
        '@path': '$.traits.address.postalCode'
      }
    }
  },
  perform: (_hsq, event) => {
    const payload = event.payload
    if (!payload.email && !payload.id) {
      return
    }

    // custom properties should be key-value pairs of strings, therefore, filtering out any non-primitive
    const { custom_properties, ...rest } = payload
    let nonObjectProperties
    if (custom_properties) {
      nonObjectProperties = Object.keys(custom_properties).reduce(
        (acc, key) => {
          if (custom_properties && typeof custom_properties[key] !== 'object') {
            acc[key] = custom_properties[key]
          }
          return acc
        },
        {} as {
          [k: string]: unknown
        }
      )
    }

    _hsq.push(['identify', { ...nonObjectProperties, ...rest }])

    if (event.settings.flushIdentifyImmediately) {
      _hsq.push(['trackPageView'])
    }
  }
}

export default action
