import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { IntegrationError, defaultValues } from '@segment/actions-core'
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
    testAuthentication: (_, { settings }) => {
      if (!settings.apiKey || settings.apiKey.length === 0) {
        throw new IntegrationError('API Key is required', 'Invalid API Key', 400)
      }

      if (!settings.workspaceIdentifier || settings.workspaceIdentifier.length === 0) {
        throw new IntegrationError('Server Token is required', 'Invalid Server Token', 400)
      }
      return true
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
