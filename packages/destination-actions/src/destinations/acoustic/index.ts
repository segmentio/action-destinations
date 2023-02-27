import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import receiveEvents from './receiveEvents'

//process.env.NODE_DEBUG = "https";

const destination: DestinationDefinition<Settings> = {
  name: 'Acoustic Segment Connector',
  slug: 'actions-acoustic-segment-connector',
  mode: 'cloud',
  authentication: {
    scheme: 'oauth2',
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
        default: 'US',
        type: 'string',
        required: true
      },
      a_client_id: {
        label: 'Client Id',
        description: 'Client Id provided with Definition of Audience Application in Acoustic',
        default: '1d99f8d8-0897-4090-983a-c517cc54032e',
        type: 'string',
        required: true
      },
      a_client_secret: {
        label: 'Client Secret',
        description: 'Client Secret provided with Definition of Audience Application in Acoustic',
        default: '124bd238-0987-40a2-b8fb-879ddd4d3241',
        type: 'password',
        required: true
      },
      a_refresh_token: {
        label: 'Client Refresh Token',
        description: 'Refresh Token provided with Defnition of Audience Application Access in Acoustic',
        default: 'rD-7E2r8BynGDaapr13oJV9BxQr20lsYGN9RPkbrtPtAS1',
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
      // Pending
      // a_audi_list_id: {
      //   label: 'Events Table List Id',
      //   description: '"Segment Events Table" List Id from Acoustic Databases Dialog ',
      //   default: '',
      //   type: 'string',
      //   required: false
      // },
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
          'Reserved for Support, code to delete and recreate the Acoustic "Segment Audience Table" effectively resetting all Segment Audience data in Acoustic',
        default: 0, //TBD: See if can maxlimit this here in the definition?
        type: 'number',
        required: false
      }
    },
    testAuthentication: async (request, { settings }) => {
      // Return a request that tests/validates the user's credentials.
      // If you do not have a way to validate the authentication fields safely,
      // you can remove the `testAuthentication` function, though discouraged.
      // *** Used to validate the credentials entered via the setup interface,
      // Use this to check the correct values entered by each Customer when using this Destination

      //Test Auth looks for 401 already, so don't need to test for success and return true/false
      return await request(`https://api-campaign-${settings.a_region}-${settings.a_pod}.goacoustic.com/oauth/token`, {
        method: 'POST',
        body: new URLSearchParams({
          client_id: settings.a_client_id,
          client_secret: settings.a_client_secret,
          refresh_token: settings.a_refresh_token,
          grant_type: 'refresh_token'
        }),
        headers: {}
      })
    },
    refreshAccessToken: async (request, { settings }) => {
      // Return a request that refreshes the access_token if the API supports it
      const at = await request(
        `https://api-campaign-${settings.a_region}-${settings.a_pod}.goacoustic.com/oauth/token`,
        {
          method: 'POST',
          body: new URLSearchParams({
            client_id: settings.a_client_id,
            client_secret: settings.a_client_secret,
            refresh_token: settings.a_refresh_token,
            grant_type: 'refresh_token'
          }),
          headers: {}
        }
      )

      //auth.accessToken = await at.data.access_token
      //return { accessToken: at.data().access_token }
      return at.json()
    }
  },
  extendRequest({ settings }) {
    settings
    return {
      headers: {
        //authorization: `Bearer ${a_auth.accessToken}`,
        Connection: 'keep-alive',
        'Accept-Encoding': 'gzip, deflate, br',
        Accept: '*/*',
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  },
  onDelete: async (request, { settings, payload }) => {
    // Return a request that performs a GDPR delete for the provided Segment userId or anonymousId
    // provided in the payload. If your destination does not support GDPR deletion you should not
    // implement this function and should remove it completely.

    //Adding GDPR Call Here,
    //GDPR per EMail,
    // Segment API to resolve to email from Userid - Segment Profile API Request
    // to get identifiers and resolve to email
    //    https://segment.com/docs/profiles/profile-api/
    //

    request.length
    settings.a_pod
    payload.userId
    return true
  },
  actions: {
    receiveEvents
  }
}
export default destination
