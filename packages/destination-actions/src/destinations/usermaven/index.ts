import { defaultValues, DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { IntegrationError } from '@segment/actions-core'

import identify from './identify'
import track from './track'

import group from './group'

import page from './page'

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
        description: 'Found on your general settings page.',
        required: true
      },
      server_token: {
        type: 'string',
        label: 'Server Token',
        description: 'Found on your general settings page.',
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

      if (!settings.server_token || settings.server_token.length === 0) {
        throw new IntegrationError('Server Token is required', 'Invalid Server Token', 400)
      }
    }
  },
  presets: [
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
    },
    {
      name: 'Page',
      subscribe: 'type = "page"',
      partnerAction: 'page',
      mapping: defaultValues(page.fields),
      type: 'automatic'
    }
  ],
  actions: {
    identify,
    track,
    group,
    page
  }
}

export default destination
