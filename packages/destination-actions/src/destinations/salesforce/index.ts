import { InvalidAuthenticationError, DestinationDefinition, RefreshAccessTokenResult } from '@segment/actions-core'
import type { Settings } from './generated-types'
// This has to be 'cases' because 'case' is a Javascript reserved word
import cases from './cases'
import lead from './lead'
import opportunity from './opportunity'
import customObject from './customObject'
import contact from './contact'
import account from './account'
import Salesforce from './sf-operations'

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
      username: {
        label: 'Username',
        description: 'Your Salesforce username',
        type: 'string'
      },
      auth_password: {
        label: 'Password',
        description: 'Your Salesforce password',
        type: 'password'
      },
      isSandbox: {
        label: 'Sandbox Instance',
        description:
          'Enable to authenticate into a sandbox instance. You can log in to a sandbox by appending the sandbox name to your Salesforce username. For example, if a username for a production org is user@acme.com and the sandbox is named test, the username to log in to the sandbox is user@acme.com.test. If you are already authenticated, please disconnect and reconnect with your sandbox username.',
        type: 'boolean',
        default: false
      }
    },
    refreshAccessToken: async (request, { auth, settings }): Promise<RefreshAccessTokenResult> => {
      const baseUrl = settings.isSandbox ? 'https://test.salesforce.com' : 'https://login.salesforce.com'
      const sfClient = new Salesforce(baseUrl, request)

      try {
        return await sfClient.authenticateWithRefreshToken(auth)
      } catch (error) {
        if (settings?.username && settings?.auth_password) {
          return await sfClient.authenticateWithPassword(auth, settings.username, settings.auth_password)
        }
      }
      throw new InvalidAuthenticationError('Failed to refresh access token')
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
