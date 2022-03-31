import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import identifyUser from './identifyUser'

import trackUser from './trackUser'

const destination: DestinationDefinition<Settings> = {
  name: 'LaunchDarkly',
  slug: 'actions-launchdarkly',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      client_id: {
        label: 'LaunchDarkly client-side ID',
        description: 'Find and copy the client-side ID in the LaunchDarkly account settings page.',
        type: 'string',
        required: true
      }
    },
    testAuthentication: (request, { settings }) => {
      return request(`https://clientsdk.launchdarkly.com/sdk/goals/${settings.client_id}`, { method: 'head' })
    }
  },

  extendRequest: () => {
    return {
      headers: { 'User-Agent': 'SegmentDestination/2.0.0', 'Content-Type': 'application/json' }
    }
  },

  actions: {
    identifyUser,
    trackUser
  }
}

export default destination
