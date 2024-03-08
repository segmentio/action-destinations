import type { ActionDefinition } from '@segment/actions-core'
import { EventType } from '../common/event'
import {
  event_id,
  timestamp,
  channel_type,
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
  title: 'Add to Cart',
  description: 'Represents a user adding an item to their cart',
  defaultSubscription: 'type = "track" and event = "Product Added"',
  fields: {
    event_id,
    timestamp,
    channel_type,
    user_id,
    device,
    session_id,
    default_currency,
    items: {
      ...items,
      required: true,
    },
    page_id,
    page_identifier_tokens
  },
  perform: (request, data) => {
    const client = new MolocoAPIClient(request, data.settings)
    const body = convertEvent({ eventType: EventType.AddToCart, payload: data.payload })
    return client.sendEvent(body)
  }
}

export default action
