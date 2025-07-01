import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { optionsFields, commonFields, content_ids, content_type, contents, currency, value } from '../fields'
import type { FBClient } from '../types'
import { buildOptions } from '../utils'

const action: BrowserActionDefinition<Settings, FBClient, Payload> = {
  title: 'View Content',
  description: "Track an View Content event to Facebook Conversions API. Trigger this when a user visits a web page you care about (for example, a product page or landing page). ViewContent tells you if someone visits a web page's URL, but not what they see or do on that page.",
  platform: 'web',
  defaultSubscription: 'type = "track" and event = "Product Viewed"',
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
    client('trackSingle', pixelId, 'ViewContent', { content_ids, contents, currency, value, ...(custom_data as Record<string, unknown> || {}) }, options)
  }
}

export default action