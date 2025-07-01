import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { optionsFields, commonFields, content_ids, contents, currency, value } from '../fields'
import type { FBClient } from '../types'
import { buildOptions } from '../utils'

const action: BrowserActionDefinition<Settings, FBClient, Payload> = {
  title: 'Add Payment info',
  description: 'Track an Add Payment Info event to Facebook Conversions API. Trigger this when payment information is added in the checkout flow.',
  platform: 'web',
  defaultSubscription: 'type = "track" and event = "Payment Info Added"',
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
    client('trackSingle', pixelId, 'AddPaymentInfo', { content_ids, contents, currency, value, ...(custom_data as Record<string, unknown> || {}) }, options)
  }
}

export default action