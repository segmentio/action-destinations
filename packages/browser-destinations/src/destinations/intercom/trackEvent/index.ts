import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import { Intercom } from '../api'
import type { Settings } from '../generated-types'
import { filterCustomTraits, isEmpty } from '../utils'
import type { Payload } from './generated-types'

const action: BrowserActionDefinition<Settings, Intercom, Payload> = {
  title: 'Track Event',
  description: 'Submit an event to Intercom.',
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
    revenue: {
      description:
        'The amount associated with a purchase. Segment will multiply by 100 as Intercom requires the amount in cents.',
      label: 'Revenue',
      type: 'number',
      required: true,
      default: {
        '@path': '$.properties.revenue'
      }
    },
    currency: {
      description:
        'The currency of the purchase amount. Segment will default to USD if revenue is provided without a currency.',
      label: 'Currency',
      type: 'string',
      required: false,
      default: {
        '@path': '$.properties.currency'
      }
    },
    event_metadata: {
      description: 'Optional metadata describing the event.',
      label: 'Event Metadata',
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

    // create price object
    let price = {}
    if (payload.revenue) {
      price = {
        amount: payload.revenue * 100,
        currency: payload.currency ?? 'USD'
      }
    }

    // filter out reserved fields, drop custom objects & arrays
    const reservedFields = [...richLinkProperties, 'currency', 'revenue']
    const filteredMetadata = filterCustomTraits(reservedFields, event_metadata)

    //merge richLinkObjects into the final payload
    //API call
    Intercom('trackEvent', event_name, {
      ...filteredMetadata,
      ...richLinkObjects,
      ...(!isEmpty(price) && { price })
    })
  }
}

export default action
