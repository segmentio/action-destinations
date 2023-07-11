import { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import updateEmailContactProfileFields from './updateEmailContactProfileFields'
import { fetchNewAccessToken } from './listrak'

const destination: DestinationDefinition<Settings> = {
  name: 'Listrak',
  slug: 'actions-listrak',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      client_id: {
        label: 'API Client ID',
        description: 'Your Listrak API client ID',
        type: 'string',
        required: true
      },
      client_secret: {
        label: 'API Client Secret',
        description: 'Your Lisrak API client secret',
        type: 'string',
        required: true
      }
    },
    testAuthentication: async (request, { settings }) => {
      await fetchNewAccessToken(request, settings)
    }
  },
  actions: {
    updateEmailContactProfileFields
  }
}

export default destination
