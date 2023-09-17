import type { DestinationDefinition } from '@segment/actions-core'

import type { Settings } from './generated-types'
import { generate_jwt } from './utils-rt'
import updateSegment from './updateSegment'
import createSegment from './createSegment'

// Response format: https://developer.yahooinc.com/datax/guide/datax-online-spec/oauth2-authentication/
interface RefreshTokenResponse {
  access_token: string
}

const destination: DestinationDefinition<Settings> = {
  name: 'Yahoo Audiences',
  slug: 'actions-yahoo-audiences',
  mode: 'cloud',

  authentication: {
    scheme: 'oauth2',
    fields: {
      mdm_id: {
        label: 'MDM ID',
        description: 'Yahoo MDM ID provided by Yahoo representative',
        type: 'string',
        required: true
      }
    },
    refreshAccessToken: async (request, { auth }) => {
      // Should refresh the token for OAuth1 and Oauth2
      // Return new Oauth1 auth string and refreshed Bearer for Oauth2
      // Oauth1
      const rt_client_key = JSON.parse(auth.clientId)['realtime_api']
      const rt_client_secret = JSON.parse(auth.clientSecret)['realtime_api']
      const jwt = generate_jwt(rt_client_key, rt_client_secret)
      const res = await request<RefreshTokenResponse>('https://id.b2b.yahooinc.com/identity/oauth2/access_token', {
        method: 'POST',
        body: new URLSearchParams({
          client_assertion: jwt,
          client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
          grant_type: 'client_credentials',
          scope: 'audience',
          realm: 'dataxonline'
        })
      })
      const tx_client_key = JSON.parse(auth.clientId)['realtime_api']
      const tx_client_secret = JSON.parse(auth.clientSecret)['realtime_api']
      const rt_access_token = res.data.access_token
      const creds = {
        tx: {
          tx_client_key: tx_client_key,
          tx_client_secret: tx_client_secret
        },
        rt: rt_access_token
      }
      const creds_base64 = Buffer.from(JSON.stringify(creds)).toString('base64')
      return { accessToken: creds_base64 }
    }
  },
  extendRequest({ auth }) {
    // Collect new Oauth1 auth string and refreshed Bearer for Oauth2 and add them to a request
    return {
      headers: {
        authorization: `${auth?.accessToken}`
      }
    }
  },

  actions: {
    updateSegment,
    createSegment
  }
}
export default destination
