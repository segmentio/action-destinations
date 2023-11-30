import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import syncAudience from './syncAudience'
import { defaultValues } from '@segment/actions-core'
import { CONSTANTS } from './constants'

const destination: DestinationDefinition<Settings> = {
  name: 'LaunchDarkly Audiences',
  slug: 'actions-launchdarkly-audiences',
  mode: 'cloud',
  description:
    'Sync [Segment Audiences](https://segment.com/docs/engage/audiences/) to LaunchDarkly [Big Segments](https://docs.launchdarkly.com/home/contexts/big-segments).',

  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'LaunchDarkly Service Token',
        description:
          'We recommend creating a dedicated [LaunchDarkly service token](https://docs.launchdarkly.com/home/account-security/api-access-tokens#service-tokens) for this destination. The service token must have the ability to perform the `createSegment` and `updateIncluded` [role actions](https://docs.launchdarkly.com/home/members/role-actions#segment-actions).',
        type: 'password',
        required: true
      },
      clientId: {
        label: 'LaunchDarkly client-side ID',
        description:
          'Copy the [client-side ID](https://app.launchdarkly.com/settings/projects) of the environment for your segment. You can find this in the LaunchDarkly **Account settings** page for your project.',
        type: 'string',
        required: true
      }
    },
    testAuthentication: (request, { settings }) => {
      // The sdk/goals/{clientID} endpoint returns a 200 if the client ID is valid and a 404 otherwise.
      return Promise.all([
        request(`${CONSTANTS.LD_CLIENT_SDK_BASE_URL}/sdk/goals/${settings.clientId}`, { method: 'head' }),
        request(`${CONSTANTS.LD_API_BASE_URL}/versions`, {
          method: 'GET',
          headers: {
            Authorization: `${settings.apiKey}`
          }
        })
      ])
    }
  },

  extendRequest({ settings }) {
    return {
      headers: {
        'User-Agent': 'SegmentSyncAudiences/1.0.0',
        'Content-Type': 'application/json',
        Authorization: `${settings.apiKey}`,
        'LD-API-Version': '20220603'
      }
    }
  },
  actions: {
    syncAudience
  },
  presets: [
    {
      name: 'Sync Engage Audience to LaunchDarkly',
      subscribe: 'type = "identify" or type = "track"',
      partnerAction: 'syncAudience',
      mapping: defaultValues(syncAudience.fields),
      type: 'automatic'
    }
  ]
}

export default destination
