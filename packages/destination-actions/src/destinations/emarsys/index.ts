import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import addToContactList from './addToContactList'
import removeFromContactList from './removeFromContactList'
import triggerEvent from './triggerEvent'
import upsertContact from './upsertContact'
import getAccessToken from './auth'
import { isLegacyAuth, createWsseHeader, LEGACY_API_BASE } from './emarsys-helper'
import { USER_AGENT_HEADER } from './constants'

const destination: DestinationDefinition<Settings> = {
  name: 'Emarsys (Actions)',
  slug: 'actions-emarsys',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      api_user: {
        label: 'API username (legacy)',
        description:
          'Your Emarsys API username. Set this together with API password to use legacy X-WSSE authentication against the v2 API.',
        type: 'string',
        required: false
      },
      api_password: {
        label: 'API password (legacy)',
        description:
          'Your Emarsys API password. Set this together with API username to use legacy X-WSSE authentication against the v2 API.',
        type: 'password',
        required: false
      },
      apiAuthEndpoint: {
        label: 'Auth endpoint',
        description: 'Authentication endpoint URL. Required when not using legacy API username/password.',
        type: 'string',
        format: 'uri',
        required: false,
        default: 'https://auth.emarsys.net/oauth2/token'
      },
      apiBaseUrl: {
        label: 'API base URL',
        description: 'The base URL for API requests. Required when not using legacy API username/password.',
        type: 'string',
        format: 'uri',
        required: false,
        default: 'https://api.emarsys.net/api/v3/'
      },
      apiClientId: {
        label: 'API ClientId',
        description: 'The ClientId for API authentication. Required when not using legacy API username/password.',
        type: 'string',
        required: false
      },
      apiClientSecret: {
        label: 'API Client Secret',
        description: 'The Client Secret for API authentication. Required when not using legacy API username/password.',
        type: 'password',
        required: false
      }
    },
    testAuthentication: async (request, { settings }) => {
      if (isLegacyAuth(settings)) {
        const wsseHeader = createWsseHeader(settings)
        const data = await request(`${LEGACY_API_BASE}settings`, {
          headers: { 'X-WSSE': wsseHeader }
        })
        if (data && data.content) {
          const api_data = JSON.parse(data.content)
          if (api_data?.replyCode === 0 && api_data?.data?.id > 0) {
            return true
          }
        }
        throw new Error('Authentication failed')
      }

      if (!settings.apiAuthEndpoint) {
        throw new Error('The authentication endpoint URL is required')
      }
      if (!settings.apiBaseUrl) {
        throw new Error('The base URL is required')
      }
      if (!settings.apiClientId || !settings.apiClientSecret) {
        throw new Error('Either legacy API username/password or OIDC client credentials are required')
      }
      await getAccessToken(
        request,
        settings.apiAuthEndpoint.replace(/\/$/, ''),
        settings.apiClientId,
        settings.apiClientSecret
      )
    }
  },

  actions: {
    upsertContact,
    addToContactList,
    removeFromContactList,
    triggerEvent
  },

  extendRequest: () => {
    return {
      headers: { 'User-Agent': USER_AGENT_HEADER }
    }
  }
}

export default destination
