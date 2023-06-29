import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import updateSegment from './updateSegment'

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
      // Please update the code here to further customize how you refresh the access_token
      const res = await request('https://id.b2b.verizonmedia.com/identity/oauth2/access_token', {
        method: 'POST',
        body: new URLSearchParams({
          refresh_token: auth.refreshToken,
          client_id: auth.clientId,
          client_secret: auth.clientSecret,
          grant_type: 'refresh_token'
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
    updateSegment
  }
}

export default destination
