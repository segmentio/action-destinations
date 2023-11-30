import { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import updateEmailContactProfileFields from './updateEmailContactProfileFields'

interface RefreshTokenResponse {
  access_token: string
}

const destination: DestinationDefinition<Settings> = {
  name: 'Listrak (Actions)',
  slug: 'actions-listrak',
  mode: 'cloud',

  authentication: {
    scheme: 'oauth2',
    fields: {
      client_id: {
        label: 'API Client ID',
        description:
          'Your Listrak API client ID. Find this on the setup tab of your Segment integration under Integrations > Integrations Management in https://admin.listrak.com.',
        type: 'string',
        required: true
      },
      client_secret: {
        label: 'API Client Secret',
        description:
          'Your Lisrak API client secret. Find this on the setup tab of your Segment integration under Integrations > Integrations Management in https://admin.listrak.com.',
        type: 'password',
        required: true
      }
    },
    refreshAccessToken: async (request, { settings, auth }) => {
      const baseUrl = `https://auth.listrak.com/OAuth2/Token`
      const res = await request<RefreshTokenResponse>(`${baseUrl}`, {
        method: 'POST',
        body: new URLSearchParams({
          client_id: settings.client_id ?? auth.clientId,
          client_secret: settings.client_secret ?? auth.clientSecret,
          grant_type: 'client_credentials'
        }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })
      return { accessToken: res.data.access_token }
    }
  },
  extendRequest({ auth }) {
    return {
      headers: {
        authorization: `Bearer ${auth?.accessToken}`
      }
    }
  },
  actions: {
    updateEmailContactProfileFields
  }
}

export default destination
