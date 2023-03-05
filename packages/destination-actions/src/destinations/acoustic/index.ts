import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import receiveEvents from './receiveEvents'

interface RefreshTokenResponse {
  access_token: string
  scope: string
  expires_in: number
  token_type: string
}

const destination: DestinationDefinition<Settings> = {
  name: 'Acoustic Campaign Cloud',
  slug: 'actions-acoustic-campaign-cloud',
  mode: 'cloud',
  authentication: {
    scheme: 'oauth-managed',
    fields: {
      a_pod: {
        label: 'Pod',
        description: 'Pod Number of Campaign Instance',
        default: '2',
        type: 'string',
        required: true
      },
      a_region: {
        label: 'Region',
        description: 'Region where Pod is hosted, either US, EU, AP, or CA',
        choices: [
          { label: 'US', value: 'US' },
          { label: 'EU', value: 'EU' },
          { label: 'AP', value: 'AP' },
          { label: 'CA', value: 'CA' }
        ],
        default: 'US',
        type: 'string',
        required: true
      },
      a_client_id: {
        label: 'Client Id',
        description: 'Client Id provided with Definition of Segment Events Application in Acoustic',
        default: '',
        type: 'string',
        required: true
      },
      a_client_secret: {
        label: 'Client Secret',
        description: 'Client Secret provided with Definition of Segment Events in Acoustic',
        default: '',
        type: 'password',
        required: true
      },
      a_refresh_token: {
        label: 'Client Refresh Token',
        description: 'Refresh Token provided with Definition of Segment Events Application Access in Acoustic',
        default: '',
        type: 'password',
        required: true
      },
      a_attributesMax: {
        label: 'Properties Max',
        description:
          'Note to Implementation Staff: "Max" definitions translate to the Maximum Number of rows written per API call and then to the number of rows written per unique email to the Acoustic table. See documentation to determine the Max allowed per data item.',
        default: 100,
        type: 'number',
        required: false
      },
      a_events_table_list_id: {
        label: 'Events Table List Id',
        description: '"Segment Events Table" List Id from Acoustic Databases Dialog ',
        default: '',
        type: 'string',
        required: false
      },
      a_authAPIURL: {
        label: 'Auth Endpoint',
        description: 'Do not change unless directed by Support',
        default: 'https://api-campaign-XX-X.goacoustic.com/oauth/token',
        type: 'string',
        required: false
      },
      a_xmlAPIURL: {
        label: 'API Endpoint',
        description: 'Do not change unless directed by Support',
        default: 'https://api-campaign-XX-X.goacoustic.com/XMLAPI',
        type: 'string',
        required: false
      },
      a_deleteCode: {
        label: 'Support Only (Delete Code)',
        description:
          'Reserved for Support, code to delete and recreate the Acoustic "Segment Events Table" effectively resetting all Segment Events data in Acoustic',
        default: 0,
        type: 'number',
        required: false
      }
    },

    testAuthentication: async (request, auth) => {
      console.log('\n\n\nIn Test Authentication...\n\n\n')
      return await request(
        `https://api-campaign-${auth.settings.a_region}-${auth.settings.a_pod}.goacoustic.com/oauth/token`,
        {
          method: 'POST',
          body: new URLSearchParams({
            client_id: auth.settings.a_client_id,
            client_secret: auth.settings.a_client_secret,
            refresh_token: auth.settings.a_refresh_token,
            grant_type: 'refresh_token'
          }),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      )
    },

    refreshAccessToken: async (request, { settings, auth }) => {
      // Return a request that refreshes the access_token if the API supports it
      console.log('\n\n\nIn Refresh Auth Token...\n\n\n')
      //const res = await getAccessToken(request, auth)

      const at = await request<RefreshTokenResponse>(
        `https://api-campaign-${settings.a_region}-${settings.a_pod}.goacoustic.com/oauth/token`,
        {
          method: 'POST',
          body: new URLSearchParams({
            client_id: auth.clientId,
            client_secret: auth.clientSecret,
            refresh_token: auth.refreshToken,
            grant_type: 'refresh_token'
          }),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      )
      return { accessToken: at.data.access_token }
    }
  },
  extendRequest({ settings }) {
    settings
    return {
      headers: {
        Connection: 'keep-alive',
        'Accept-Encoding': 'gzip, deflate, br',
        Accept: '*/*'
      }
    }
  },
  actions: {
    receiveEvents
  }
}
export default destination
