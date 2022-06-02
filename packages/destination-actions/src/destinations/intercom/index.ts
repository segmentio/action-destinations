import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import identifyUser from './identifyUser'

import groupIdentifyUser from './groupIdentifyUser'

const destination: DestinationDefinition<Settings> = {
  name: 'Intercom (Actions)',
  slug: 'actions-intercom',
  mode: 'cloud',

  authentication: {
    scheme: 'oauth2',
    fields: {}
    // testAuthentication: (request) => {
    //   // Return a request that tests/validates the user's credentials.
    //   // If you do not have a way to validate the authentication fields safely,
    //   // you can remove the `testAuthentication` function, though discouraged.
    // },
    // refreshAccessToken: async (request, { auth }) => {
    //   // Return a request that refreshes the access_token if the API supports it
    //   const res = await request('https://www.example.com/oauth/refresh', {
    //     method: 'POST',
    //     body: new URLSearchParams({
    //       refresh_token: auth.refreshToken,
    //       client_id: auth.clientId,
    //       client_secret: auth.clientSecret,
    //       grant_type: 'refresh_token'
    //     })
    //   })

    //   return { accessToken: res.body.access_token }
    // }
  },
  extendRequest({ auth }) {
    return {
      headers: {
        authorization: `Bearer ${auth?.accessToken}`
      }
    }
  },

  onDelete: async (request, { payload }) => {
    return request(`https://api.intercom.io/contacts/${payload.userId}`, {
      method: 'DELETE'
    })
  },

  actions: {
    identifyUser,
    groupIdentifyUser
  }
}

export default destination
