import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { SKY_OAUTH2_TOKEN_URL } from './constants'

import createOrUpdateIndividualConstituent from './createOrUpdateIndividualConstituent'

interface RefreshTokenResponse {
  access_token: string
}

const destination: DestinationDefinition<Settings> = {
  name: "Blackbaud Raiser's Edge NXT",
  slug: 'actions-blackbaud-raisers-edge-nxt',
  mode: 'cloud',

  authentication: {
    scheme: 'oauth-managed',
    fields: {},
    //testAuthentication: (request) => {
    testAuthentication: () => {
      // Return a request that tests/validates the user's credentials.
      // If you do not have a way to validate the authentication fields safely,
      // you can remove the `testAuthentication` function, though discouraged.
    },
    refreshAccessToken: async (request, { auth }) => {
      // Return a request that refreshes the access_token if the API supports it
      const res = await request<RefreshTokenResponse>(SKY_OAUTH2_TOKEN_URL, {
        method: 'POST',
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: auth.refreshToken,
          client_id: auth.clientId,
          client_secret: auth.clientSecret
        })
      })

      return { accessToken: res.data.access_token }
    }
  },
  extendRequest({ auth }) {
    return {
      headers: {
        authorization: `Bearer ${auth?.accessToken}`,
        'Bb-Api-Subscription-Key': `${auth?.bb_api_subscription_key}`
      }
    }
  },

  //onDelete: async (request, { settings, payload }) => {
  onDelete: async () => {
    // Return a request that performs a GDPR delete for the provided Segment userId or anonymousId
    // provided in the payload. If your destination does not support GDPR deletion you should not
    // implement this function and should remove it completely.
  },

  actions: {
    createOrUpdateIndividualConstituent
  }
}

export default destination
