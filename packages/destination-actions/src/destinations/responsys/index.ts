import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import asyncMergeProfileListMembers from './asyncMergeProfileListMembers'
import asyncMergePetRecords from './asyncMergePetRecords'

interface RefreshTokenResponse {
  authToken: string
}

const destination: DestinationDefinition<Settings> = {
  name: 'Responsys (Actions)',
  slug: 'actions-responsys',
  mode: 'cloud',
  description: 'Send Profile List Member and Profile Extension Table data to Responsys.',
  authentication: {
    scheme: 'oauth2',
    fields: {
      username: {
        label: 'Username',
        description: 'Responsys username',
        type: 'string',
        required: true
      },
      userPassword: {
        label: 'Password',
        description: 'Responsys password',
        type: 'string',
        required: true
      },
      baseUrl: {
        label: 'Responsys endpoint URL',
        description:
          "Responsys endpoint URL. Refer to Responsys documentation for more details. Must start with 'HTTPS://'. See [Responsys docs](https://docs.oracle.com/en/cloud/saas/marketing/responsys-develop/API/GetStarted/Authentication/auth-endpoints-rest.htm).",
        type: 'string',
        format: 'uri',
        required: true
      }
    },
    testAuthentication: (_, { settings }) => {
      if (settings.baseUrl.startsWith('https://'.toLowerCase())) {
        return Promise.resolve('Success')
      } else {
        return Promise.reject('Responsys endpoint URL must start with https://')
      }
    },
    refreshAccessToken: async (request, { settings }) => {
      const baseUrl = settings.baseUrl?.replace(/\/$/, '')
      const endpoint = `${baseUrl}/rest/api/v1.3/auth/token`

      const res = await request<RefreshTokenResponse>(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `user_name=${settings.username}&password=${settings.userPassword}&auth_type=password`
      })
      return { accessToken: res.data.authToken }
    }
  },
  extendRequest({ auth }) {
    return {
      headers: {
        'Content-Type': 'application/json',
        authorization: `${auth?.accessToken}`
      }
    }
  },
  actions: {
    asyncMergeProfileListMembers,
    asyncMergePetRecords
  }
}

export default destination
