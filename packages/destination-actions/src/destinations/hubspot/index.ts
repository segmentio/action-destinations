import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import sendCustomBehavioralEvent from './sendCustomBehavioralEvent'
import upsertContact from './upsertContact'
import upsertCompany from './upsertCompany'
import upsertCustomObjectRecord from './upsertCustomObjectRecord'
import { HUBSPOT_BASE_URL } from './properties'
interface RefreshTokenResponse {
  access_token: string
}

const destination: DestinationDefinition<Settings> = {
  name: 'HubSpot Cloud Mode (Actions)',
  slug: 'actions-hubspot-cloud',
  mode: 'cloud',

  authentication: {
    scheme: 'oauth2',
    fields: {
      portalId: {
        description: 'The Hub ID of your HubSpot account.',
        label: 'Hub ID',
        type: 'string'
      }
    },
    testAuthentication: (request) => {
      // HubSpot doesn't have a test authentication endpoint, so we using a lightweight CRM API to validate access token
      return request(`${HUBSPOT_BASE_URL}/crm/v3/objects/contacts?limit=1`)
    },
    refreshAccessToken: async (request, { auth }) => {
      // Return a request that refreshes the access_token if the API supports it
      const res = await request<RefreshTokenResponse>(`${HUBSPOT_BASE_URL}/oauth/v1/token`, {
        method: 'POST',
        body: new URLSearchParams({
          refresh_token: auth.refreshToken,
          client_id: auth.clientId,
          client_secret: auth.clientSecret,
          grant_type: 'refresh_token'
        })
      })

      return { accessToken: res.data?.access_token }
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
    sendCustomBehavioralEvent,
    upsertContact,
    upsertCompany,
    upsertCustomObjectRecord
  }
}

export default destination
