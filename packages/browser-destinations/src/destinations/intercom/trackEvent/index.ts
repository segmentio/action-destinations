import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import { Intercom } from '../api'
import type { Settings } from '../generated-types'
import { filterCustomTraits, isEmpty } from '../utils'
import type { Payload } from './generated-types'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, Intercom, Payload> = {
  title: 'Track Event',
  description: '',
  platform: 'web',
  fields: {
    event_name: {
      description: 'The name of the event.',
      label: 'Event Name',
      type: 'string',
      required: true,
      default: {
        '@path': '$.event'
      }
    },
    price: {
      description: 'Price or monetary amount.',
      label: 'Price',
      type: 'object',
      required: false,
      properties: {
        amount: {
          description: 'The amount.',
          label: 'Amount',
          type: 'number',
          required: true,
          default: {
            '@path': '$.properties.revenue'
          }
        },
        currency: {
          description: 'The currency of the amount. It defaults to USD if left empty.',
          label: 'Currency',
          type: 'string',
          required: false,
          default: {
            '@path': '$.properties.currency'
          }
        }
      }
    },
    event_metadata: {
      description: 'Parameters specific to the event.',
      label: 'Event Parameters',
      type: 'object',
      required: true,
      default: {
        '@path': '$.properties'
      }
    }
  },
  perform: (Intercom, event) => {
    //remove event_name & event_metadata from the payload (they will be handled separately)
    const { event_name, event_metadata, ...rest } = event.payload
    const payload = { ...rest }
    const richLinkProperties = Intercom.richLinkProperties ? Intercom.richLinkProperties : []

    // create a list of the richLinkObjects that will be passed to Intercom
    const richLinkObjects: { [k: string]: unknown } = {}
    if (richLinkProperties.length != 0) {
      Object.entries(event_metadata).forEach(([key, value]) => {
        if (richLinkProperties.includes(key)) {
          richLinkObjects[key] = value
        }
      })
    }

    // remove price if it is empty
    if (isEmpty(payload.price) || !payload.price?.amount) {
      delete payload.price
    } else {
      //intercom requires amounts in cents
      payload.price.amount *= 100

      //currency defaults to USD
      if (!payload.price.currency) {
        payload.price.currency = 'USD'
      }
    }

    // filter out reserved fields, drop custom objects & arrays
    const reservedFields = [...richLinkProperties, 'currency', 'revenue']
    const filteredMetadata = filterCustomTraits(reservedFields, event_metadata)

    //merge richLinkObjects into the final payload
    //API call
    Intercom('trackEvent', event_name, {
      ...payload,
      ...filteredMetadata,
      ...richLinkObjects
    })
  }
}

export default action
