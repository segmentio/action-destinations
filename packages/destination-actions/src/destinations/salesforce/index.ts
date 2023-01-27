import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
// This has to be 'cases' because 'case' is a Javascript reserved word
import cases from './cases'
import lead from './lead'
import opportunity from './opportunity'
import customObject from './customObject'
import contact from './contact'
import account from './account'

interface RefreshTokenResponse {
  access_token: string
}

const destination: DestinationDefinition<Settings> = {
  name: 'Salesforce (Actions)',
  slug: 'muhahahaha-actions-salesforce',
  mode: 'cloud',

  authentication: {
    scheme: 'oauth2',
    fields: {
      muhahahaha: {
        label: 'Muhahaha add a new required field',
        description: 'Muhahaha add a new required field',
        type: 'string',
        required: true
      },
      instanceUrl: {
        label: 'Instance URL',
        description:
          'The user specific instance URL returned by Salesforce Oauth. This setting is hidden to the user and set by Oauth Service.',
        type: 'string',
        required: true
      },
      isSandbox: {
        label: 'Sandbox Instance',
        description:
          'Enable to authenticate into a sandbox instance. You can log in to a sandbox by appending the sandbox name to your Salesforce username. For example, if a username for a production org is user@acme.com and the sandbox is named test, the username to log in to the sandbox is user@acme.com.test. If you are already authenticated, please disconnect and reconnect with your sandbox username.',
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
  extendRequest({ auth }) {
    return {
      headers: {
        authorization: `Bearer ${auth?.accessToken}`
      }
    }
  },

  actions: {
    lead,
    customObject,
    cases,
    contact,
    opportunity,
    account
  }
}

export default destination
