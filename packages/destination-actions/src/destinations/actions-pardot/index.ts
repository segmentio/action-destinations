import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import prospects from './prospects'

interface RefreshTokenResponse {
  access_token: string
}

const destination: DestinationDefinition<Settings> = {
  name: 'Pardot (Actions)',
  slug: 'actions-pardot',
  mode: 'cloud',

  authentication: {
    scheme: 'oauth2',
    fields: {
      businessUnitID: {
        label: 'Pardot Business Unit ID',
        description:
          'The Pardot Business Unit ID associated with your Pardot Account. ' +
          'To find your Business Unit ID in Salesforce, go to **Setup** and search for `Pardot`. Your Pardot Business Unit ID is an 18-character string that starts with `0Uv`.  If you cannot access the Pardot Account Setup information, ask your Salesforce Administrator to find the Pardot Business Unit ID for you.',
        type: 'string',
        required: true
      },
      accountID: {
        label: 'Account ID',
        description:
          'You can find your Account ID (`piAId`) under **Marketing > Campaigns** in your [Pardot account](https://pi.pardot.com/campaign). After selecting your desired website campaign, press **View Tracking Code**. ',
        type: 'string',
        required: true
      },
      isSandbox: {
        label: 'Sandbox Instance',
        description:
          'Enable to authenticate into a sandbox instance. You can log in to a sandbox by appending the sandbox name to your Salesforce username. For example, if a username for a production org is user@acme.com and the sandbox is named `test`, the username to log in to the sandbox is user@acme.com.test. If you are already authenticated, please disconnect and reconnect with your sandbox username.',
        type: 'boolean',
        default: false
      }
    },
    refreshAccessToken: async (request, { auth, settings }) => {
      // Return a request that refreshes the access_token if the API supports it
      const baseUrl = settings.isSandbox ? 'https://test.salesforce.com' : 'https://login.salesforce.com'
      const res = await request<RefreshTokenResponse>(`${baseUrl}/services/oauth2/token`, {
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
  extendRequest({ settings, auth }) {
    return {
      headers: {
        Authorization: `Bearer ${auth?.accessToken}`,
        'Pardot-Business-Unit-Id': settings.businessUnitID
      }
    }
  },

  actions: {
    prospects
  }
}

export default destination
