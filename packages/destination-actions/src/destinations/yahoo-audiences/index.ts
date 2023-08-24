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
    scheme: 'oauth-managed',
    fields: {
      mdm_id: {
        label: 'MDM ID',
        description: 'Yahoo MDM ID provided by Yahoo representative',
        type: 'string',
        required: true
      }
    },
    refreshAccessToken: async (request, { auth }) => {
      const jwt = generate_jwt(auth.clientId, auth.clientSecret)
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

      return { accessToken: res.data.access_token }
    }
  },
  extendRequest({ auth }) {
    // Please update the code here to modify the request headers
    return {
      headers: {
        authorization: `Bearer ${auth?.accessToken}`
      }
    }
  },

  actions: {
    updateSegment,
    createSegment
  }
}
export default destination
