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
  revenue,
  page_id,
  page_identifier_tokens,
} from '../common/fields'
import { MolocoAPIClient } from '../common/request-client'
import { convertEvent } from '../common/convert'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'


const action: ActionDefinition<Settings, Payload> = {
  title: 'Add to Wishlist',
  description: 'Represents a user adding an item to their wishlist',
  defaultSubscription: 'type = "track" and event = "Product Added to Wishlist"',
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
    revenue,
    page_id,
    page_identifier_tokens,
  },
  perform: (request, {payload, settings}) => {
    const client = new MolocoAPIClient(request, settings)
    const body = convertEvent({ eventType: EventType.AddtoWishlist, payload, settings })
    return client.sendEvent(body)
  }
}

export default action
