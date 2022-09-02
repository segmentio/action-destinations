import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { Hubspot } from '../types'
import { flatten } from '../utils/flatten'

const action: BrowserActionDefinition<Settings, Hubspot, Payload> = {
  title: 'Update an Existing Contact or Create a New One',
  description: 'Use this action to identify website contacts.',
  defaultSubscription: 'type = "identify"',
  platform: 'web',
  fields: {
    email: {
      description:
        'Identify a contacts by email address when you want to update an existing contact or create a new one.',
      label: 'Email Address',
      type: 'string',
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.traits.email' },
          then: { '@path': '$.traits.email' },
          else: { '@path': '$.email' }
        }
      }
    },
    id: {
      description: 'A custom external ID that identifies the visitor.',
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
      description: 'The name of the company the contacts is associated with.',
      label: 'Company Name',
      type: 'string',
      required: false,
      default: {
        '@path': '$.traits.company.name'
      }
    },
    country: {
      description: 'The name of the country the contacts is associated with.',
      label: 'Country',
      type: 'string',
      required: false,
      default: {
        '@path': '$.traits.address.country'
      }
    },
    state: {
      description: 'The name of the state the contacts is associated with.',
      label: 'State',
      type: 'string',
      required: false,
      default: {
        '@path': '$.traits.address.state'
      }
    },
    city: {
      description: 'The name of the city the contacts is associated with.',
      label: 'City',
      type: 'string',
      required: false,
      default: {
        '@path': '$.traits.address.city'
      }
    },
    address: {
      description: 'The street address of the contacts.',
      label: 'Street Address',
      type: 'string',
      required: false,
      default: {
        '@path': '$.traits.address.street'
      }
    },
    zip: {
      description: 'The postal code of the contacts.',
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
    if (!payload.email) {
      return
    }

    // custom properties should be key-value pairs of strings, therefore, filtering out any non-primitive
    const { custom_properties, ...rest } = payload
    let flattenProperties
    if (custom_properties) {
      flattenProperties = flatten(custom_properties, '', ['address', 'company'])
    }

    _hsq.push(['identify', { ...flattenProperties, ...rest }])

    if (event.settings.flushIdentifyImmediately) {
      _hsq.push(['trackPageView'])
    }
  }
}

export default action
