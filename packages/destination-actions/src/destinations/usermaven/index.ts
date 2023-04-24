import { defaultValues, DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { IntegrationError } from '@segment/actions-core'

import identify from './identify'
import track from './track'

import group from './group'

const destination: DestinationDefinition<Settings> = {
  name: 'Usermaven (Actions)',
  slug: 'actions-usermaven',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      api_key: {
        type: 'string',
        label: 'API Key',
        description: 'Found on your settings page.',
        required: true
      }
    },
    testAuthentication: (_, { settings }) => {
      // Return a request that tests/validates the user's credentials.
      // If you do not have a way to validate the authentication fields safely,
      // you can remove the `testAuthentication` function, though discouraged.
      if (!settings.api_key || settings.api_key.length === 0) {
        throw new IntegrationError('API Key is required', 'Invalid API Key', 400)
      }
    }
  },
  presets: [
    {
      name: 'Track Event',
      subscribe: 'type = "track"',
      partnerAction: 'track',
      mapping: defaultValues(track.fields)
    },
    {
      name: 'Identify User',
      subscribe: 'type = "identify"',
      partnerAction: 'identify',
      mapping: defaultValues(identify.fields)
    },
    {
      name: 'Group',
      subscribe: 'type = "group"',
      partnerAction: 'group',
      mapping: defaultValues(group.fields)
    }
  ],
  actions: {
    identify,
    track,
    group
  }
}

export default destination
