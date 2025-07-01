import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { optionsFields, commonFields, eventName, content_category, content_ids, content_name, content_type, contents, currency, delivery_category, num_items, predicted_ltv, search_string, status, value } from '../fields'
import type { FBClient } from '../types'
import { buildOptions } from '../utils'

const action: BrowserActionDefinition<Settings, FBClient, Payload> = {
  title: 'Custom Event',
  description: 'Track a Custom Event to Facebook Conversions API. Build your own custom event to send. You can also use this Action to trigger Standard events containing any type of field.',
  platform: 'web',
  fields: {
    eventName,
    ...optionsFields, 
    content_category,
    content_ids, 
    content_name,
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
    currency,
    delivery_category,
    num_items, 
    predicted_ltv,
    search_string,
    status,
    value,
    ...commonFields
  },
  perform: (client, { payload, settings }) => {
    const { pixelId } = settings
    const { custom_data, currency, value} = payload
    const options = buildOptions(payload)
    client('trackSingle', pixelId, 'Purchase', { content_ids, content_type, contents, currency, num_items, value, ...(custom_data as Record<string, unknown> || {}) }, options)
  }
}

export default action