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
  referrer_page_id,
} from '../common/fields'
import { MolocoAPIClient } from '../common/request-client'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { convertEvent } from '../common/convert'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Land',
  description: 'Represents a user visiting the client’s website from an external source (ex. Google Shopping)',
  defaultSubscription: 'type = "page" and properties.name = "Land"',
  fields: {
    event_id,
    timestamp,
    user_id,
    device,
    session_id,
    default_currency,
    items,
    page_id,
    page_identifier_tokens,
    referrer_page_id: {
      ...referrer_page_id,
      required: true
    },
  },
  perform: (request, {payload, settings}) => {
    const client = new MolocoAPIClient(request, settings)
    const body = convertEvent({ eventType: EventType.Land, payload, settings })
    return client.sendEvent(body)
  }
}

export default action
