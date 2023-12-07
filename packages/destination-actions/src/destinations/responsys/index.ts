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
        label: 'username',
        description: 'Responsys Username',
        type: 'string',
        required: true
      },
      userPassword: {
        label: 'password',
        description: 'Responsys Password',
        type: 'string',
        required: true
      },
      authUrl: {
        label: 'Authentication URL',
        description: 'Responsys Authentication URL',
        type: 'string',
        required: true
      }
    },

    // NOTE: For some reason, settings doesn't work. Hence using auth for now
    refreshAccessToken: async (request, { auth }) => {
      // Return a request that refreshes the access_token if the API supports it
      const endpoint =
        (auth as any).authUrl ?? 'https://njp1q7u-api.responsys.ocs.oraclecloud.com/rest/api/v1.3/auth/token'
      const res = await request<RefreshTokenResponse>(`${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `user_name=${(auth as any).username}&password=${(auth as any).userPassword}&auth_type=password`
      })
      return { accessToken: res.data.authToken }
    }
  },
  extendRequest({ auth }) {
    console.log('auth extendRequest', auth)
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    if (auth && auth.accessToken) {
      headers.authorization = `${auth.accessToken}`
    }
    return {
      headers
    }
  },
  actions: {
    asyncMergeProfileListMembers,
    asyncMergePetRecords
  }
}

export default destination
