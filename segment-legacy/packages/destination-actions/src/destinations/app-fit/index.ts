import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import AppFitConfig from './config'
import track from './track'

const destination: DestinationDefinition<Settings> = {
  name: 'App Fit',
  slug: 'actions-app-fit',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'API Key',
        description: 'AppFit project API key. ',
        type: 'string',
        required: true
      }
    },
    testAuthentication: (request, { settings }) => {
      return request(`${AppFitConfig.apiUrl}/api-keys/current`, {
        headers: { Authorization: `Basic ${settings.apiKey}` }
      })
    }
  },

  onDelete: async (request, { settings, payload }) => {
    // Return a request that performs a GDPR delete for the provided Segment userId or anonymousId
    // provided in the payload. If your destination does not support GDPR deletion you should not
    // implement this function and should remove it completely.
    return request(`${AppFitConfig.apiUrl}/metric-event-users/${payload.userId}?source=segment_destination`, {
      headers: { Authorization: `Bearer ${settings.apiKey}` },
      method: 'DELETE'
    })
  },

  actions: {
    track
  }
}

export default destination
