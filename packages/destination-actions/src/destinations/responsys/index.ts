import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
// import {
//   enable_batching,
//   batch_size
// } from './rsp-properties'

import asyncMergeProfileListMembers from './asyncMergeProfileListMembers'

import asyncMergePetRecords from './asyncMergePetRecords'

interface RefreshTokenResponse {
  authToken: string
}

const destination: DestinationDefinition<Settings> = {
  name: 'Responsys (Actions)',
  slug: 'actions-responsys',
  mode: 'cloud',
  description: 'Send Segment events to Responsys.',
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
        // Depending on Responsys instance type, a customer may need to use a different base URL: https://docs.oracle.com/en/cloud/saas/marketing/responsys-develop/API/GetStarted/Authentication/auth-endpoints-rest.htm
        label: 'Responsys endpoint URL',
        description: 'Responsys endpoint URL. Refer to Responsys documentation for more details.', // https://docs.oracle.com/en/cloud/saas/marketing/responsys-develop/API/GetStarted/Authentication/auth-endpoints-rest.htm
        type: 'string',
        required: true
      }
    },
    // Refreshing Responsys access token once it expires after 3 hours
    refreshAccessToken: async (request, { settings }) => {
      // Remove trailing slash from authUrl if it exists
      const baseUrl = settings.baseUrl?.replace(/\/$/, '')
      const endpoint = `${baseUrl}/rest/api/v1.3/auth/token`
      // Return a request that refreshes the access_token if the API supports it
      // console.log('settings:', settings.username, settings.userPassword)
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
    // console.log('auth extendRequest', auth)
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
