import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { optionsFields, commonFields, content_ids, contents, currency, value } from '../fields'
import type { FBClient } from '../types'
import { buildOptions } from '../utils'

const action: BrowserActionDefinition<Settings, FBClient, Payload> = {
  title: 'Add To Wishlist',
  description: 'Track an Add To Wishlist event to Facebook Conversions API. Trigger this when a product is added to a wishlist.',
  platform: 'web',
  defaultSubscription: 'type = "track" and event = "Product Added To Wishlist"',
  fields: {
    ...optionsFields, 
    content_ids, 
    contents: {
      ...contents,
      default: {
        '@arrayPath': [
          '$.properties.products',
          {
            id: { '@path': '$.id' },
            quantity: { '@path': '$.quantity' },
            item_price: { '@path': '$.price' }
          }
        ]
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
    client('trackSingle', pixelId, 'AddToWishlist', { content_ids, contents, currency, value, ...(custom_data as Record<string, unknown> || {}) }, options)
  }
}

export default action