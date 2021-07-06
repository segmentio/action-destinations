import { omit } from '@segment/actions-core'
import dayjs from '../../../lib/dayjs'
import { eventSchema } from '../event-schema'
import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

interface AmplitudeEvent extends Omit<Payload, 'products' | 'trackRevenuePerProduct' | 'time' | 'session_id'> {
  time?: number
  session_id?: number
}

const revenueKeys = ['revenue', 'price', 'productId', 'quantity', 'revenueType']

interface EventRevenue {
  revenue?: number
  price?: number
  productId?: string
  quantity?: number
  revenueType?: string
}

function getRevenueProperties(payload: EventRevenue): EventRevenue {
  if (typeof payload.revenue !== 'number') {
    return {}
  }

  return {
    revenue: payload.revenue,
    revenueType: payload.revenueType ?? 'Purchase',
    quantity: typeof payload.quantity === 'number' ? Math.round(payload.quantity) : undefined,
    price: payload.price,
    productId: payload.productId
  }
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Log Event',
  description: 'Send an event to Amplitude.',
  defaultSubscription: 'type = "track"',
  fields: {
    trackRevenuePerProduct: {
      label: 'Track Revenue Per Product',
      description:
        'When enabled, track revenue with each product within the event. When disabled, track total revenue once for the event.',
      type: 'boolean',
      default: false
    },
    ...eventSchema,
    products: {
      label: 'Products',
      description: 'The list of products purchased.',
      type: 'object',
      multiple: true,
      properties: {
        price: {
          label: 'Price',
          type: 'number',
          description:
            'The price of the item purchased. Required for revenue data if the revenue field is not sent. You can use negative values to indicate refunds.'
        },
        quantity: {
          label: 'Quantity',
          type: 'integer',
          description: 'The quantity of the item purchased. Defaults to 1 if not specified.'
        },
        revenue: {
          label: 'Revenue',
          type: 'number',
          description:
            'Revenue = price * quantity. If you send all 3 fields of price, quantity, and revenue, then (price * quantity) will be used as the revenue value. You can use negative values to indicate refunds.'
        },
        productId: {
          label: 'Product ID',
          type: 'string',
          description:
            'An identifier for the item purchased. You must send a price and quantity or revenue with this field.'
        },
        revenueType: {
          label: 'Revenue Type',
          type: 'string',
          description:
            'The type of revenue for the item purchased. You must send a price and quantity or revenue with this field.'
        }
      },
      default: {
        '@path': '$.properties.products'
      }
    },
    use_batch_endpoint: {
      label: 'Use Batch Endpoint',
      description:
        "If true, events are sent to Amplitude's `batch` endpoint rather than their `httpapi` events endpoint. Enabling this setting may help reduce 429s – or throttling errors – from Amplitude. More information about Amplitude's throttling is available in [their docs](https://developers.amplitude.com/docs/batch-event-upload-api#429s-in-depth).",
      type: 'boolean',
      default: false
    }
  },
  perform: (request, { payload, settings }) => {
    // Omit revenue properties initially because we will manually stitch those into events as prescribed
    const { products = [], trackRevenuePerProduct, time, session_id, ...rest } = omit(payload, revenueKeys)
    const properties = rest as AmplitudeEvent

    if (time && dayjs.utc(time).isValid()) {
      properties.time = dayjs.utc(time).valueOf()
    }

    if (session_id && dayjs.utc(session_id).isValid()) {
      properties.session_id = dayjs.utc(session_id).valueOf()
    }

    const events: AmplitudeEvent[] = [
      {
        ...properties,
        // Conditionally track revenue with main event
        ...(products.length && trackRevenuePerProduct ? {} : getRevenueProperties(payload))
      }
    ]

    for (const product of products) {
      events.push({
        ...properties,
        // Or track revenue per product
        ...(trackRevenuePerProduct ? getRevenueProperties(product as EventRevenue) : {}),
        event_properties: product,
        event_type: 'Product Purchased',
        insert_id: properties.insert_id ? `${properties.insert_id}-${events.length + 1}` : undefined
      })
    }

    const endpoint = payload.use_batch_endpoint
      ? 'https://api2.amplitude.com/batch'
      : 'https://api2.amplitude.com/2/httpapi'

    return request(endpoint, {
      method: 'post',
      json: {
        api_key: settings.apiKey,
        events
      }
    })
  }
}

export default action
