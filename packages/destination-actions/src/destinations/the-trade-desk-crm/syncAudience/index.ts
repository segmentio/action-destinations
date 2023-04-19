import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { segment_name, region, pii_type, merge_mode, email, enable_batching, event_name } from '../properties'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync Audience to Crm Data Segment',
  description: '',
  fields: {
    segment_name: { ...segment_name },
    region: { ...region },
    pii_type: { ...pii_type },
    merge_mode: { ...merge_mode },
    email: { ...email },
    enable_batching: { ...enable_batching },
    event_name: { ...event_name }
  },
  perform: (request, data) => {
    // Make your partner api request here!
    return request('https://example.com', {
      method: 'post',
      json: data.payload
    })
  }
}

export default action
