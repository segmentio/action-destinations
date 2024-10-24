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
import { convertEvent } from '../common/convert'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Page View',
  description: 
    'Represents a user viewing a certain page that is pertinent to sequence-based ML model training (Ex. a user browsing sneakers)',
  defaultSubscription: 'type = "page" and properties.name != "Home" and properties.name != "Land"',
  fields: {
    event_id,
    timestamp,
    user_id,
    device,
    session_id,
    default_currency,
    items,
    page_id: {
      ...page_id,
      description: page_id.description + ' Either page_id or page_identifier_tokens is required.'
    },
    page_identifier_tokens: {
      ...page_identifier_tokens,
      description: page_identifier_tokens.description + ' Either page_id or page_identifier_tokens is required.'
    
    },
    referrer_page_id
  },
  perform: (request, {payload, settings}) => {
    const client = new MolocoAPIClient(request, settings)
    const body = convertEvent({ eventType: EventType.PageView, payload, settings })
    return client.sendEvent(body)
  }
}

export default action
