import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { event_action, product_id, product_sku, price, currency, event_id, timestamp} from '../fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'Send Segment analytics / track() events to Optimizely Data Platform',
  fields: {
    event_action: {...event_action},
    product_id: {...product_id},
    product_sku: {...product_sku},
    price: {...price},
    currency: {...currency},
    event_id: {...event_id},
    timestamp: {...timestamp}
  },
  perform: (request, { payload, settings }) => {
    let body = {
      action: payload.event_action
    }
    
    return request('https://eo493p73oqjeket.m.pipedream.net', {
      method: 'post',
      json: body
    });
  }
}

export default action
