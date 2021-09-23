import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Example Action',
  description: 'An example action that supports batch payloads.',
  fields: {
    // Feel free to remove/replace this field with relevant ones for Criteo
    greeting: {
      label: 'Greeting',
      description: 'A greeting message',
      type: 'string',
      required: true
    }
  },
  perform: (request, data) => {
    return request('https://example.com', {
      method: 'post',
      json: data.payload
    })
  },
  // `performBatch` defines the behavior for a batch of events
  // `data.payload` is an array of payloads in the `performBatch` function
  performBatch: (request, data) => {
    return request('https://example.com', {
      method: 'post',
      json: data.payload
    })
  }
}

export default action
