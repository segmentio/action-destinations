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
      description: 'The name of the event',
      label: 'Event Name',
      required: true,
      type: 'string',
      default: {
        '@path': '$.event'
      }
    },
    price: {
      label: 'price',
      description: 'price or monetary amount',
      required: false,
      type: 'object',
      properties: {
        amount: {
          label: 'Amount',
          type: 'number',
          required: true,
          description: 'the amount',
          default: {
            '@path': '$.properties.revenue'
          }
        },
        currency: {
          label: 'Currency',
          type: 'string',
          description: 'the currency of the amount. defaults to USD if left empty',
          required: false,
          default: {
            '@path': '$.properties.currency'
          }
        }
      }
    },
    event_metadata: {
      label: 'Event Parameters',
      description: 'Parameters specific to the event',
      type: 'object',
      default: {
        '@path': '$.properties'
      }
    }
  },
  perform: (Intercom, event) => {
    const { event_name, event_metadata, ...rest } = event.payload
    const payload = { ...rest }
    const richLinkProperties = Intercom.richLinkProperties

    // create a list of the richLinkObjects that will be passed to Intercom
    const richLinkObjects: { [k: string]: unknown } = {}
    if (event_metadata && richLinkProperties.length != 0) {
      for (const [key, value] of Object.entries(event_metadata)) {
        if (richLinkProperties.includes(key)) {
          richLinkObjects[key] = value
        }
      }
    }

    // remove price if it is empty
    if (isEmpty(payload.price)) {
      delete payload.price
    } else if (payload.price) {
      //intercom requires amounts in cents
      payload.price.amount *= 100

      //currency defaults to USD
      if (!payload.price.currency) {
        payload.price.currency = 'usd'
      }
    }

    // filter out reserved fields, drop custom objects & arrays
    const reservedFields = [...richLinkProperties, 'currency', 'revenue']
    const filteredMetadata = filterCustomTraits(reservedFields, event_metadata)

    //rejoin richLinkObjects in the final payload
    //API CALL
    Intercom('trackEvent', event_name, {
      ...payload,
      ...filteredMetadata,
      ...richLinkObjects
    })
  }
}

export default action
