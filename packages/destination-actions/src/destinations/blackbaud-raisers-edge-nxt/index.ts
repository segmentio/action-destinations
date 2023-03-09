import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { SKY_API_BASE_URL, SKY_OAUTH2_TOKEN_URL } from './constants'
import { RefreshTokenResponse } from './types'
import createGift from './createGift'
import createOrUpdateIndividualConstituent from './createOrUpdateIndividualConstituent'

const destination: DestinationDefinition<Settings> = {
  name: "Blackbaud Raiser's Edge NXT",
  slug: 'actions-blackbaud-raisers-edge-nxt',
  mode: 'cloud',

  authentication: {
    scheme: 'oauth-managed',
    fields: {
      bbApiSubscriptionKey: {
        label: 'Blackbaud API Subscription Key',
        description: 'The access key found on your Blackbaud "My subscriptions" page.',
        type: 'string',
        required: true
      }
    },
    testAuthentication: (request) => {
      return request(`${SKY_API_BASE_URL}/emailaddresstypes`)
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
  extendRequest({ auth, settings }) {
    return {
      headers: {
        authorization: `Bearer ${auth?.accessToken}`,
        'Bb-Api-Subscription-Key': `${settings.bbApiSubscriptionKey}`
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
    createGift,
    createOrUpdateIndividualConstituent
  }
}

export default destination
