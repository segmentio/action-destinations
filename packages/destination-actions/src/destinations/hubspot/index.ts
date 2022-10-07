import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import sendCustomBehavioralEvent from './sendCustomBehavioralEvent'
<<<<<<< HEAD
import contact from './contact'
import createCustomObjectRecord from './createCustomObjectRecord'
=======
import upsertContact from './upsertContact'
import createCustomObjectRecord from './createCustomObjectRecord'
import { hubSpotBaseURL } from './properties'
>>>>>>> CONMAN-199
interface RefreshTokenResponse {
  access_token: string
}

const destination: DestinationDefinition<Settings> = {
  name: 'Hubspot Cloud Mode (Actions)',
  slug: 'actions-hubspot-cloud',
  mode: 'cloud',

  authentication: {
    scheme: 'oauth2',
    fields: {},
    testAuthentication: (request) => {
      // HubSpot doesn't have a test authentication endpoint, so we using a lightweight CRM API to validate access token
<<<<<<< HEAD
      return request(`https://api.hubapi.com/crm/v3/objects/contacts?limit=1`)
    },
    refreshAccessToken: async (request, { auth }) => {
      // Return a request that refreshes the access_token if the API supports it
      const res = await request<RefreshTokenResponse>('https://api.hubapi.com/oauth/v1/token', {
=======
      return request(`${hubSpotBaseURL}/crm/v3/objects/contacts?limit=1`)
    },
    refreshAccessToken: async (request, { auth }) => {
      // Return a request that refreshes the access_token if the API supports it
      const res = await request<RefreshTokenResponse>(`${hubSpotBaseURL}/oauth/v1/token`, {
>>>>>>> CONMAN-199
        method: 'POST',
        body: new URLSearchParams({
          refresh_token: auth.refreshToken,
          client_id: auth.clientId,
          client_secret: auth.clientSecret,
          grant_type: 'refresh_token'
        })
      })

<<<<<<< HEAD
      return { accessToken: res.data.access_token }
=======
      return { accessToken: res.data?.access_token }
>>>>>>> CONMAN-199
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
<<<<<<< HEAD
    contact,
=======
    upsertContact,
>>>>>>> CONMAN-199
    createCustomObjectRecord
  }
}

export default destination
