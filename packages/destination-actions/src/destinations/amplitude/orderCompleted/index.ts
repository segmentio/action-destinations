import { omit, removeUndefined } from '@segment/actions-core'
import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import dayjs from '../../../lib/dayjs'
import { eventSchema } from '../event-schema'
import { convertUTMProperties } from '../utm'
import { convertReferrerProperty } from '../referrer'
import { mergeUserProperties } from '../merge-user-properties'
import { parseUserAgentProperties } from '../user-agent'

interface AmplitudeEvent extends Omit<Payload, 'products' | 'trackRevenuePerProduct' | 'time'> {
  time?: number
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
  title: 'Order Completed',
  description:
    'Track purchased products from an event. This event will produce multiple events in Amplitude from a single Segment event, one for each product in the products array.',
  defaultSubscription: 'type = "track" and event = "Order Completed"',
  // Uses the same fields as trackUser (we can duplicate it here, if needed)
  fields: {
    trackRevenuePerProduct: {
      label: 'Track Revenue Per Product',
      description:
        'When enabled, track revenue with each product within the event. When disabled, track total revenue once for the event.',
      type: 'boolean',
      required: true,
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
    },
    ...eventSchema
  },
  perform: (request, { payload, settings }) => {
    // Omit revenue properties initially because we will manually stitch those into events as prescribed
    const {
      products = [],
      trackRevenuePerProduct,
      time,
      session_id,
      userAgent,
      userAgentParsing,
      utm_properties,
      referrer,
      min_id_length,
      library,
      ...rest
    } = omit(payload, revenueKeys)

    const properties = rest as AmplitudeEvent

    if (properties.platform) {
      properties.platform = properties.platform.replace(/ios/i, 'iOS').replace(/android/i, 'Android')
    }

    if (library === 'analytics.js') {
      properties.platform = 'Web'
    }

    if (time && dayjs.utc(time).isValid()) {
      properties.time = dayjs.utc(time).valueOf()
    }

    if (session_id && dayjs.utc(session_id).isValid()) {
      properties.session_id = dayjs.utc(session_id).valueOf()
    }

    if (Object.keys(payload.utm_properties ?? {}).length || payload.referrer) {
      properties.user_properties = mergeUserProperties(
        convertUTMProperties({ utm_properties }),
        convertReferrerProperty({ referrer }),
        omit(properties.user_properties ?? {}, ['utm_properties', 'referrer'])
      )
    }

    let options
    if (min_id_length && min_id_length > 0) {
      options = { min_id_length }
    }

    const orderCompletedEvent = {
      // Conditionally parse user agent using amplitude's library
      ...(userAgentParsing && parseUserAgentProperties(userAgent)),
      // Make sure any top-level properties take precedence over user-agent properties
      ...removeUndefined(properties),
      // Conditionally track revenue with main event
      ...(products.length && trackRevenuePerProduct ? {} : getRevenueProperties(payload)),
      library: 'segment'
    }

    const events = [orderCompletedEvent]

    for (const product of products) {
      events.push({
        ...properties,
        // Or track revenue per product
        ...(trackRevenuePerProduct ? getRevenueProperties(product) : {}),
        event_properties: product,
        event_type: 'Product Purchased',
        insert_id: properties.insert_id && `${properties.insert_id}-${events.length + 1}`,
        library: 'segment'
      })
    }

    const endpoint = payload.use_batch_endpoint
      ? 'https://api2.amplitude.com/batch'
      : 'https://api2.amplitude.com/2/httpapi'

    return request(endpoint, {
      method: 'post',
      json: {
        api_key: settings.apiKey,
        events,
        options
      }
    })
  }
}

export default action
