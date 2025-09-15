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
  shipping_charge,
} from '../common/fields'
import { MolocoAPIClient } from '../common/request-client'
import { convertEvent } from '../common/convert'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Purchase',
  description: 'Represents a user purchasing an item',
  defaultSubscription: 'type = "track" and event = "Order Completed"',
  fields: {
    event_id,
    timestamp,
    user_id,
    device,
    session_id,
    default_currency,
    items: {
      ...items,
      required: true
    },
    revenue: {
      ...revenue,
      required: true
    },
    page_id,
    page_identifier_tokens,
    shipping_charge
  },
  perform: (request, {payload, settings}) => {
    const client = new MolocoAPIClient(request, settings)
    const body = convertEvent({ eventType: EventType.Purchase, payload, settings})
    return client.sendEvent(body)
  }
}

export default action
