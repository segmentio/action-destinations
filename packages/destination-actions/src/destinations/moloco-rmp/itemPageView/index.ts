import type { ActionDefinition } from '@segment/actions-core'
import { EventType } from '../common/event'
import {
  event_id,
  timestamp,
  user_id,
  device,
  session_id,
  default_currency,
  items,
  page_id,
  page_identifier_tokens,
} from '../common/fields'
import { MolocoAPIClient } from '../common/request-client'
import { convertEvent } from '../common/convert'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Item Page View',
  description: 'Represents a user viewing an item page',
  defaultSubscription: 'type = "track" and event = "Product Viewed"',
  fields: {
    event_id,
    timestamp,
    user_id,
    device,
    session_id,
    default_currency,
    items: {
      ...items,
      required: true,
      default: {
        '@arrayPath': [
          '$.properties',
          {
            id: { '@path': '$.product_id' },
            price: { '@path': '$.price' },
            currency: { '@path': '$.currency' },
            quantity: { '@path': '$.quantity' },
            seller_id: { '@path': '$.seller_id'}
          }
        ]
      }
    },
    page_id,
    page_identifier_tokens,  
  },
  perform: (request, {payload, settings}) => {
    const client = new MolocoAPIClient(request, settings)
    const body = convertEvent({ eventType: EventType.ItemPageView, payload, settings })
    return client.sendEvent(body)
  }
}

export default action
