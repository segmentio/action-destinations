import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import aliasUser from './aliasUser'
import trackEvent from './trackEvent'

const destination: DestinationDefinition<Settings> = {
  name: 'LaunchDarkly',
  slug: 'actions-launchdarkly',
  mode: 'cloud',
  description:
    'Use Segment events as custom metric events in LaunchDarkly experiments, so you can measure results immediately, without any instrumentation, code, or delays.',

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
      // The sdk/goals/{clientID} endpoint returns a 200 if the client ID is valid and a 404 otherwise.
      return request(`https://clientsdk.launchdarkly.com/sdk/goals/${settings.client_id}`, { method: 'head' })
    }
  },

  extendRequest: () => {
    return {
      headers: { 'User-Agent': 'SegmentDestination/2.0.0', 'Content-Type': 'application/json' }
    }
  },

  actions: {
    aliasUser,
    trackEvent
  }
}

export default destination
