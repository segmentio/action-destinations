import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { optionsFields, commonFields, content_ids, contents, currency, num_items, value } from '../fields'
import type { FBClient } from '../types'
import { buildOptions } from '../utils'

const action: BrowserActionDefinition<Settings, FBClient, Payload> = {
  title: 'Initiate Checkout',
  description: 'Track an Initiate Checkout event to Facebook Conversions API. Trigger this a person enters the checkout flow prior to completing the checkout flow.',
  platform: 'web',
  defaultSubscription: 'type = "track" and event = "Checkout Started"',
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
    client('trackSingle', pixelId, 'InitiateCheckout', { content_ids, contents, currency, num_items, value, ...(custom_data as Record<string, unknown> || {}) }, options)
  }
}

export default action