import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import addToContactList from './addToContactList'
import removeFromContactList from './removeFromContactList'
import triggerEvent from './triggerEvent'
import upsertContact from './upsertContact'
import getAccessToken from './auth'

const destination: DestinationDefinition<Settings> = {
  name: 'Emarsys (Actions)',
  slug: 'actions-emarsys',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      apiAuthEndpoint: {
        label: 'Auth endpoint',
        description: 'Authentication endpoint URL',
        type: 'string',
        required: true,
        default: 'https://auth.emarsys.net/oauth2/token'
      },
      apiBaseUrl: {
        label: 'API base URL',
        description: 'The base URL for API requests',
        type: 'string',
        required: true,
        default: 'https://api.emarsys.net/api/v3/'
      },
      apiClientId: {
        label: 'API ClientId',
        description: 'The ClientId for API authentication',
        type: 'string',
        required: true
      },
      apiClientSecret: {
        label: 'API Client Secret',
        description: 'The Client Secret for API authentication',
        type: 'password',
        required: true
      }
    },
    testAuthentication: async (request, { settings }) => {
      if (!settings.apiAuthEndpoint) {
        throw new Error('The authentication endpoint URL is required')
      }
      if (!settings.apiBaseUrl) {
        throw new Error('The base URL is required')
      }
      const { accessToken } = await getAccessToken(
        request,
        settings.apiAuthEndpoint,
        settings.apiClientId,
        settings.apiClientSecret
      )
      if (!accessToken) {
        throw new Error('Authentication failed')
      }
    }
  },

  actions: {
    upsertContact,
    addToContactList,
    removeFromContactList,
    triggerEvent
  }
}

export default destination
