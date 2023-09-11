import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  user_identifiers,
  event_action,
  product_id,
  timestamp
} from '../fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Single Product Event',
  description: 'Send Segment analytics / track() events to Optimizely Data Platform',
  fields: {
    user_identifiers: user_identifiers,
    event_action: {...event_action},
    product_id: {...product_id},
    timestamp: {...timestamp}
  },
  perform: (request, { payload }) => {
    const body = {
      type: 'product',
      identifiers: payload.user_identifiers,
      action: payload.event_action,
      product_id: payload.product_id,
      timestamp: payload.timestamp
    }
    
    return request('https://eo493p73oqjeket.m.pipedream.net', {
      method: 'post',
      json: body
    });
  }
}

export default action
