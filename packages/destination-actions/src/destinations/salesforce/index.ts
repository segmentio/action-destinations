import { DestinationDefinition, HTTPError, InvalidAuthenticationError } from '@segment/actions-core'
import type { Settings } from './generated-types'
// This has to be 'cases' because 'case' is a Javascript reserved word
import cases from './cases'
import lead from './lead'
import opportunity from './opportunity'
import customObject from './customObject'
import contact from './contact'
import account from './account'
import { authenticateWithPassword } from './sf-operations'

import lead2 from './lead2'
import cases2 from './cases2'
import customObject2 from './customObject2'
import account2 from './account2'
import opportunity2 from './opportunity2'
import contact2 from './contact2'

interface RefreshTokenResponse {
  access_token: string
}

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
        description:
          'The username of the Salesforce account you want to connect to. When all three of username, password, and security token are provided, a username-password flow is used to authenticate. This field is hidden to all users except those who have opted in to the username+password flow.',
        type: 'string'
      },
      auth_password: {
        // auth_ prefix is used because password is a reserved word
        label: 'Password',
        description:
          'The password of the Salesforce account you want to connect to. When all three of username, password, and security token are provided, a username-password flow is used to authenticate. This field is hidden to all users except those who have opted in to the username+password flow.',
        type: 'string'
      },
      security_token: {
        label: 'Security Token',
        description:
          'The security token of the Salesforce account you want to connect to. When all three of username, password, and security token are provided, a username-password flow is used to authenticate. This value will be appended to the password field to construct the credential used for authentication. This field is hidden to all users except those who have opted in to the username+password flow.',
        type: 'string'
      }
    },
    refreshAccessToken: async (request, { auth, settings }) => {
      if (settings.username && settings.auth_password) {
        const { accessToken } = await authenticateWithPassword(
          settings.username,
          settings.auth_password,
          settings.security_token,
          settings.isSandbox
        )

        return { accessToken }
      }

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
      }).catch((error: HTTPError) => {
        // Salesforce sometimes returns 400 when concurrently refreshing tokens using the same refresh token.
        // https://help.salesforce.com/s/articleView?language=en_US&id=release-notes.rn_security_refresh_token_requests.htm&release=250&type=5
        if (error.response?.status === 400 || error.response?.status === 401) {
          throw new InvalidAuthenticationError('Invalid or expired refresh token')
        }
        throw error
      })
      return { accessToken: res.data?.access_token }
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
    account,
    lead2,
    cases2,
    customObject2,
    account2,
    opportunity2,
    contact2
  }
}

export default destination
