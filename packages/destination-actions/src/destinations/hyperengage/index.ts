import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { defaultValues } from '@segment/actions-core'
import identify from './identify'
import group from './group'
import track from './track'

const presets: DestinationDefinition['presets'] = [
  {
    name: 'Track Event',
    subscribe: 'type = "track"',
    partnerAction: 'track',
    mapping: defaultValues(track.fields),
    type: 'automatic'
  },
  {
    name: 'Identify User',
    subscribe: 'type = "identify"',
    partnerAction: 'identify',
    mapping: defaultValues(identify.fields),
    type: 'automatic'
  },
  {
    name: 'Group',
    subscribe: 'type = "group"',
    partnerAction: 'group',
    mapping: defaultValues(group.fields),
    type: 'automatic'
  }
]

const destination: DestinationDefinition<Settings> = {
  name: 'Hyperengage (Actions)',
  slug: 'actions-hyperengage',
  mode: 'cloud',
  description: 'Hyperengage actions destination, to connect your product usage data from Segment to Hyperengage',
  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        type: 'string',
        label: 'API Key',
        description: 'Your Hyperengage API key located in the Integration Settings page.',
        required: true
      },
      workspaceIdentifier: {
        type: 'string',
        label: 'Workspace Identifier',
        description: 'Your Hyperengage workspace identifier located in the Integration Settings page.',
        required: true
      }
    },
    testAuthentication: async (request, { settings }) => {
      return await request('https://api.hyperengage.io/api/v1/verify_api_key', {
        method: 'post',
        json: {
          api_key: `${settings.apiKey}`,
          workspace_identifier: `${settings.workspaceIdentifier}`
        }
      })
    }
  },

  presets,
  actions: {
    identify,
    group,
    track
  }
}

export default destination
