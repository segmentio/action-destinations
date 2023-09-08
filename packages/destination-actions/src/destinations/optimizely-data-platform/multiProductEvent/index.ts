import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { event_action, products, event_id, timestamp} from '../fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Multi Product Event',
  description: '',
  fields: {
    event_action: {...event_action},
    products: {...products},
    event_id: {...event_id},
    timestamp: {...timestamp}
  },
  perform: (request, { payload, settings }) => {
    let body = {
      action: payload.event_action
    }
    
    return request('https://example.com', {
      method: 'post',
      json: body
    });
  }
}

export default action
