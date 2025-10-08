import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Traits Sync',
  description: 'Sync user traits data to Memora',
  defaultSubscription: 'type = "track" or type = "identify"',
  fields: {
    // Fields will be added later
  },
  perform: (_, data) => {
    // Individual event processing logic
    const { payload } = data
    console.log('Single payload:', payload)

    // TODO: Implement the API call to sync traits data
    return {}
  },
  performBatch: (_, data) => {
    // Batch processing logic
    const { payload: payloads } = data
    console.log('Batch payloads:', payloads)

    // TODO: Implement batch API call to sync multiple traits
    return {}
  }
}

export default action
