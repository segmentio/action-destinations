import type { DestinationDefinition, ModifiedResponse } from '@segment/actions-core'

import type { Settings } from './generated-types'
import { generate_jwt } from './utils-rt'
import updateSegment from './updateSegment'
import createSegment from './createSegment'

import createCustomerNode from './createCustomerNode'

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
      // Oauth2 client_credentials
      const rt_client_key = JSON.parse(auth.clientId)['rt_api']
      console.log('rt_client_key:', rt_client_key)
      const rt_client_secret = JSON.parse(auth.clientSecret)['rt_api']
      console.log('rt_client_secret:', rt_client_secret)
      const jwt = generate_jwt(rt_client_key, rt_client_secret)
      // TODO: What should we do if `res` returns an error?
      const res: ModifiedResponse<RefreshTokenResponse> = await request<RefreshTokenResponse>(
        'https://id.b2b.yahooinc.com/identity/oauth2/access_token',
        {
          method: 'POST',
          body: new URLSearchParams({
            client_assertion: jwt,
            client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
            grant_type: 'client_credentials',
            scope: 'audience',
            realm: 'dataxonline'
          })
        }
      )
      // Oauth1 (sign request)
      const tx_client_key = JSON.parse(auth.clientId)['tax_api']
      const tx_client_secret = JSON.parse(auth.clientSecret)['tax_api']
      const rt_access_token = res.data.access_token
      console.log('rt_access_token:', rt_access_token)
      const creds = {
        // Oauth1
        tx: {
          tx_client_key: tx_client_key,
          tx_client_secret: tx_client_secret
        },
        // Oauth2
        rt: rt_access_token
      }
      const creds_base64 = Buffer.from(JSON.stringify(creds)).toString('base64')
      console.log('creds_base64:', creds_base64)
      return { accessToken: creds_base64 }
    }
  },
  /*
// Potentially will be used to extend Tax Oauth1 requests.
  extendRequest({ auth, payload }) {
    let resp;
    if (payload.segment_audience_id) {
      resp = 'this is audience update';
      console.log('AUDIENCE_ID IS AVAILABLE')
    } else {
      resp = 'this is taxonomy update'
      console.log('AUDIENCE_ID IS NOT AVAILABLE')
    }
    console.log(resp)
    return { 
      headers: {
        // authorization: `${auth?.accessToken}`
      }
    }
  },
*/

  actions: {
    updateSegment,
    createSegment,
    createCustomerNode
  }
}
export default destination
