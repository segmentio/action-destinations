import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import addUserToAudience from './addUserToAudience'
import removeUserFromAudience from './removeUserFromAudience'
import { criteoAuthenticate } from './criteo-audiences'
import type { ClientCredentials } from './criteo-audiences'

const destination: DestinationDefinition<Settings> = {
  name: 'Criteo Audiences',
  slug: 'actions-criteo-audiences',
  description: 'Add/remove users to/from Criteo Audiences using Criteo API',
  mode: 'cloud',
  authentication: {
    scheme: 'custom',
    fields: {
      client_id: {
        label: 'API Client ID',
        description: 'Your Criteo API client ID',
        type: 'string',
        required: true
      },
      client_secret: {
        label: 'API Client Secret',
        description: 'Your Criteo API client secret',
        type: 'string',
        required: true
      },
      advertiser_id: {
        label: 'Advertiser ID',
        description: 'Your Criteo Advertiser ID',
        type: 'string',
        required: true
      }
    },
    testAuthentication: async (request, { settings }) => {
      const credentials: ClientCredentials = await criteoAuthenticate(request, {
        client_id: settings.client_id,
        client_secret: settings.client_secret
      })
      return credentials.access_token
    }
  },
  actions: {
    addUserToAudience,
    removeUserFromAudience
  }
}

export default destination
