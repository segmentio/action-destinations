import { DestinationDefinition, RefreshAccessTokenResult } from '@segment/actions-core'
import type { Settings } from './generated-types'
// This has to be 'cases' because 'case' is a Javascript reserved word
import cases from './cases'
import lead from './lead'
import opportunity from './opportunity'
import customObject from './customObject'
import contact from './contact'
import account from './account'

const destination: DestinationDefinition<Settings> = {
  name: 'Salesforce (Actions)',
  slug: 'actions-salesforce',
  mode: 'cloud',

  authentication: {
    scheme: 'oauth2',
    fields: {
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
      },
      username: {
        label: 'Username',
        description: 'The username of the Salesforce account you want to connect to.',
        type: 'string'
      },
      auth_password: {
        label: 'Password',
        description: 'The password of the Salesforce account you want to connect to.',
        type: 'string'
      },
      security_token: {
        label: 'Security Token',
        description: 'The security token of the Salesforce account you want to connect to.',
        type: 'string'
      }
    },
    refreshAccessToken: async (request, { auth, settings }) => {
      // Return a request that refreshes the access_token if the API supports it
      const baseUrl = settings.isSandbox ? 'https://test.salesforce.com' : 'https://login.salesforce.com'
      const res = await request<RefreshAccessTokenResult>(`${baseUrl}/services/oauth2/token`, {
        method: 'POST',
        body: new URLSearchParams({
          refresh_token: auth.refreshToken,
          client_id: auth.clientId,
          client_secret: auth.clientSecret,
          grant_type: 'refresh_token'
        })
      })
      return { accessToken: res.data.accessToken }
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
