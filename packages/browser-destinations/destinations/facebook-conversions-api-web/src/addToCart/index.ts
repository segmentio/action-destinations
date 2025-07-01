import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { optionsFields, commonFields, content_ids, content_type, contents, currency, value } from '../fields'
import type { FBClient } from '../types'
import { buildOptions } from '../utils'

const action: BrowserActionDefinition<Settings, FBClient, Payload> = {
  title: 'Add To Cart',
  description: 'Track an Add To Cart event to Facebook Conversions API. Trigger this when a product is added to a cart.',
  platform: 'web',
  defaultSubscription: 'type = "track" and event = "Product Added"',
  fields: {
    ...optionsFields, 
    content_ids, 
    content_type,
    contents: {
      ...contents,
      default:
      {
        id: { '@path': '$.properties.id' },
        quantity: { '@path': '$.properties.quantity' },
        item_price: { '@path': '$.properties.price' }
      }
    },
    currency: {
      ...currency, 
      required: true
    }, 
    value: {
      ...value, 
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.properties.total' },
          then: { '@path': '$.properties.total' },
          else: { '@path': '$.properties.revenue' }
        }
      }
    },
    ...commonFields
  },
  perform: (client, { payload, settings }) => {
    const { pixelId } = settings
    const { custom_data, currency, value} = payload
    const options = buildOptions(payload)
    client('trackSingle', pixelId, 'AddToCart', { content_ids, content_type, contents, currency, value, ...(custom_data as Record<string, unknown> || {}) }, options)
  }
}

export default action