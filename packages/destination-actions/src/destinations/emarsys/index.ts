import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import addToContactList from './addToContactList'
import removeFromContactList from './removeFromContactList'
import triggerEvent from './triggerEvent'
import upsertContact from './upsertContact'
import getAccessToken from './auth'
import { isLegacyAuth, createWsseHeader, getApiBaseUrl, getAuthHeader } from './emarsys-helper'
import { USER_AGENT_HEADER } from './constants'

import triggerEngagementEvent from './triggerEngagementEvent'

const destination: DestinationDefinition<Settings> = {
  name: 'Emarsys (Actions)',
  slug: 'actions-emarsys',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      auth_type: {
        label: 'Authentication Method',
        description: 'Select which authentication method to use.',
        type: 'string',
        default: 'new',
        choices: [
          { label: 'New (Recommended)', value: 'new' },
          { label: 'Legacy', value: 'legacy' }
        ]
      },
      api_user: {
        label: 'API username (legacy)',
        description:
          'Your Emarsys API username. Set this together with API password to use legacy X-WSSE authentication against the v2 API.',
        type: 'string',
        required: false,
        depends_on: {
          match: 'any',
          conditions: [
            { fieldKey: 'auth_type', operator: 'is', value: undefined },
            { fieldKey: 'auth_type', operator: 'is', value: 'legacy' }
          ]
        }
      },
      api_password: {
        label: 'API password (legacy)',
        description:
          'Your Emarsys API password. Set this together with API username to use legacy X-WSSE authentication against the v2 API.',
        type: 'password',
        required: false,
        depends_on: {
          match: 'any',
          conditions: [
            { fieldKey: 'auth_type', operator: 'is', value: undefined },
            { fieldKey: 'auth_type', operator: 'is', value: 'legacy' }
          ]
        }
      },
      apiAuthEndpoint: {
        label: 'Auth endpoint',
        description: 'Authentication endpoint URL. Required when not using legacy API username/password.',
        type: 'string',
        format: 'uri',
        required: false,
        default: 'https://auth.emarsys.net/oauth2/token',
        depends_on: {
          conditions: [{ fieldKey: 'auth_type', operator: 'is', value: 'new' }]
        }
      },
      apiBaseUrl: {
        label: 'API base URL',
        description: 'The base URL for API requests. Required when not using legacy API username/password.',
        type: 'string',
        format: 'uri',
        required: false,
        default: 'https://api.emarsys.net/api/v3/',
        depends_on: {
          conditions: [{ fieldKey: 'auth_type', operator: 'is', value: 'new' }]
        }
      },
      apiClientId: {
        label: 'API ClientId',
        description: 'The ClientId for API authentication. Required when not using legacy API username/password.',
        type: 'string',
        required: false,
        depends_on: {
          conditions: [{ fieldKey: 'auth_type', operator: 'is', value: 'new' }]
        }
      },
      apiClientSecret: {
        label: 'API Client Secret',
        description: 'The Client Secret for API authentication. Required when not using legacy API username/password.',
        type: 'password',
        required: false,
        depends_on: {
          conditions: [{ fieldKey: 'auth_type', operator: 'is', value: 'new' }]
        }
      }
    },
    testAuthentication: async (request, { settings }) => {
      if (isLegacyAuth(settings)) {
        if (!settings.api_user) {
          throw new Error('The API username (legacy) is required')
        }
        if (!settings.api_password) {
          throw new Error('The API password (legacy) is required')
        }
      } else {
        if (!settings.apiAuthEndpoint) {
          throw new Error('The authentication endpoint URL is required')
        }
        if (!settings.apiBaseUrl) {
          throw new Error('The base URL is required')
        }
        if (!settings.apiClientId || !settings.apiClientSecret) {
          throw new Error('OIDC client credentials are required')
        }
        await getAccessToken(
          request,
          settings.apiAuthEndpoint.replace(/\/$/, ''),
          settings.apiClientId,
          settings.apiClientSecret
        )
      }

      const authHeader = await getAuthHeader(request, settings)
      const data = await request(`${getApiBaseUrl(settings)}settings`, {
        method: 'get',
        headers: authHeader,
        throwHttpErrors: false
      })
      if (data && data.content) {
        const api_data = JSON.parse(data.content)
        if (api_data?.replyCode === 0 && api_data?.data?.id > 0) {
          return true
        }
      }
      throw new Error('Authentication failed')
    }
  },

  actions: {
    upsertContact,
    addToContactList,
    removeFromContactList,
    triggerEvent,
    triggerEngagementEvent
  },

  extendRequest: ({ settings }) => {
    let extendRequestReturn = {}
    if (isLegacyAuth(settings)) {
      extendRequestReturn = {
        headers: {
          'User-Agent': USER_AGENT_HEADER,
          'X-WSSE': createWsseHeader(settings)
        },
        responseType: 'json'
      }
    } else {
      extendRequestReturn = {
        headers: {
          'User-Agent': USER_AGENT_HEADER
        }
      }
    }
    return extendRequestReturn
  }
}

export default destination
