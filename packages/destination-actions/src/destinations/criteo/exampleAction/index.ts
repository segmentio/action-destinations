import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Example Action',
  description: '',
  fields: {},
  perform: (_request, _data) => {
    // Make your partner api request here!
    // return request('https://example.com', {
    //   method: 'post',
    //   json: data.payload
    // })
  },
  // `performBatch` defines the behavior for a batch of events
  // `data.payload` is an array of payloads in the `performBatch` function
  performBatch: (_request, _data) => {
    //
    // return request('https://example.com', {
    //   method: 'post',
    //   json: data.payload
    // })
  }
}

export default action
