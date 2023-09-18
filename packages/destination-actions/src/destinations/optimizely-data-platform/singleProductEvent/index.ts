import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  user_identifiers,
  event_action,
  product_id,
  timestamp
} from '../fields'
import { hosts } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Single Product Event',
  description: 'Send Segment analytics / track() events to Optimizely Data Platform',
  fields: {
    user_identifiers: user_identifiers,
    event_action: {...event_action},
    product_id: {...product_id},
    timestamp: {...timestamp}
  },
  perform: (request, { payload, settings }) => {
    const host = hosts[settings.region]
  
    const body = {
      type: 'product',
      requestType: 'single',
      user_identifiers: payload.user_identifiers,
      action: payload.event_action,
      timestamp: payload.timestamp,
      product_id: payload.product_id
    }
    
    return request(`${host}/product_event`, {
      method: 'post',
      json: body
    });
  }
}

export default action
