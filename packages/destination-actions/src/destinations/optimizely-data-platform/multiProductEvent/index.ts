import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  event_action,
  products,
  event_id,
  timestamp
} from '../fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Multi Product Event',
  description: 'Send Segment analytics / track() events to Optimizely Data Platform',
  fields: {
    event_action: {...event_action},
    products: {...products},
    event_id: {...event_id},
    timestamp: {...timestamp}
  },
  perform: (request, { payload }) => {

    const productIDs = payload.products?.map((p) => p.product_id);
    const body = {
      type: 'product',
      action: payload.event_action,
      purchase: productIDs
    }
    
    return request('https://example.com', {
      method: 'post',
      json: body
    });
  }
}

export default action
