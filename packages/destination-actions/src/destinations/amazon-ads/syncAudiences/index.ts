import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync Audiences',
  description: 'Sync audiences from Segment to Amazon Ads Audience.',
  fields: {},
  perform: (request, data) => {
    return request('https://example.com', {
      method: 'post',
      json: data.payload
    })
  }
}

export default action
