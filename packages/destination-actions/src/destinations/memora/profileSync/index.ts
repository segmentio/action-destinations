import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Profile Sync',
  description: 'Sync user profile data to Memora',
  defaultSubscription: 'type = "identify"',
  fields: {
    // Fields will be added later
  },
  perform: (request, data) => {
    // Individual event processing logic
    const { payload } = data

    // TODO: Implement the API call to sync profile data
    return request('https://api.memora.com/profiles', {
      method: 'POST',
      json: {
        // Map payload data to Memora format
        userId: payload.userId
        // Add other profile fields here
      }
    })
  },
  performBatch: (request, data) => {
    // Batch processing logic
    const { payload: payloads } = data

    // TODO: Implement batch API call to sync multiple profiles
    return request('https://api.memora.com/profiles/batch', {
      method: 'POST',
      json: {
        profiles: payloads.map((payload) => ({
          userId: payload.userId
          // Add other profile fields here
        }))
      }
    })
  }
}

export default action
