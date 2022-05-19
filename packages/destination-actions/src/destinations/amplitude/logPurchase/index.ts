import { omit, removeUndefined } from '@segment/actions-core'
import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { parseUserAgentProperties } from '../user-agent'
import { AmplitudeEvent, doPerform } from '../logEvent'
import { fields as logEventFields } from '../logEvent'

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

function getEvents(payload: Payload, properties: AmplitudeEvent): AmplitudeEvent[] {
  const { products = [], userAgent, userAgentParsing, trackRevenuePerProduct } = payload

  // Remove the revenue keys from the properties object because we will add them back if
  // trackRevenuePerProduct is false, but if it's trackRevenuePerProduct is true
  // we don't add them back to the main event because we'd be double-counting revenue.
  properties = omit(properties, revenueKeys)

  const events: AmplitudeEvent[] = [
    {
      // Conditionally parse user agent using amplitude's library
      ...(userAgentParsing && parseUserAgentProperties(userAgent)),
      // Make sure any top-level properties take precedence over user-agent properties
      ...removeUndefined(properties),
      // Conditionally track revenue with main event
      ...(products?.length && trackRevenuePerProduct ? {} : getRevenueProperties(payload)),
      library: 'segment'
    }
  ]

  for (const product of products) {
    events.push({
      // Remove the products array from product events
      ...omit(properties, ['products']),
      // Or track revenue per product
      ...(trackRevenuePerProduct ? getRevenueProperties(product as EventRevenue) : {}),
      event_properties: product,
      event_type: 'Product Purchased',
      insert_id: properties.insert_id ? `${properties.insert_id}-${events.length + 1}` : undefined,
      library: 'segment'
    })
  }

  return events
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Log Purchase',
  description: 'Send an event to Amplitude.',
  defaultSubscription: 'type = "track" and event = "Order Completed"',
  fields: {
    ...logEventFields,
    trackRevenuePerProduct: {
      label: 'Track Revenue Per Product',
      description:
        'When enabled, track revenue with each product within the event. When disabled, track total revenue once for the event.',
      type: 'boolean',
      default: false
    },
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
    }
  },
  perform: (request, { payload, settings }) => doPerform(request, payload, settings, getEvents)
}

export default action
