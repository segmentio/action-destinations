import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { optionsFields, commonFields, content_ids, content_type, contents, currency, search_string, num_items, value } from '../fields'
import type { FBClient } from '../types'
import { buildOptions } from '../utils'

const action: BrowserActionDefinition<Settings, FBClient, Payload> = {
  title: 'Search',
  description: 'Track a Search event to Facebook Conversions API. Trigger this when a search is made.',
  platform: 'web',
  defaultSubscription: 'type = "track" and event = "Products Searched"',
  fields: {
    ...optionsFields, 
    content_ids, 
    content_type, 
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
    search_string,
    num_items, 
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
    client('trackSingle', pixelId, 'Search', { content_ids, content_type, contents, currency, search_string, num_items, value, ...(custom_data as Record<string, unknown> || {}) }, options)
  }
}

export default action