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
  search_query,
  page_id,
  page_identifier_tokens,
  referrer_page_id,
} from '../common/fields'
import { MolocoAPIClient } from '../common/request-client'
import { convertEvent } from '../common/convert'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Search',
  defaultSubscription: 'type = "track" and event = "Products Searched"',
  description: 'Represents a user searching for an item',
  fields: {
    event_id,
    timestamp,
    user_id,
    device,
    session_id,
    default_currency,
    items,
    search_query: {
      ...search_query,
      required: true
    },
    page_id,
    page_identifier_tokens,
    referrer_page_id
  },
  perform: (request, {payload, settings}) => {
    const client = new MolocoAPIClient(request, settings)
    const body = convertEvent({ eventType: EventType.Search, payload, settings })
    return client.sendEvent(body)
  }
}

export default action
