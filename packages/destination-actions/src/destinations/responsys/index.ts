import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import asyncMergeProfileListMembers from './asyncMergeProfileListMembers'

import asyncMergePetRecords from './asyncMergePetRecords'

const destination: DestinationDefinition<Settings> = {
  name: 'Responsys',
  slug: 'actions-responsys',
  mode: 'cloud',

  authentication: {
    scheme: 'oauth2',
    fields: {
      username: {
        label: 'USERNAME',
        description: 'Responsys Username',
        type: 'string',
        required: true
      },
      userPassword: {
        label: 'PASSWORD',
        description: 'Responsys Password',
        type: 'string',
        required: true
      },
      authUrl: {
        label: 'AUTHENTICATION URL',
        description: 'Responsys Authentication URL',
        type: 'string',
        required: false
      }
    },
    //testAuthentication: (request) => {
    // Return a request that tests/validates the user's credentials.
    // If you do not have a way to validate the authentication fields safely,
    // you can remove the `testAuthentication` function, though discouraged.
    // return true
    //},
    refreshAccessToken: async (request, { auth }) => {
      // Return a request that refreshes the access_token if the API supports it
      // let endpoint = `${auth.authUrl}`
      const endpoint = 'https://njp1q7u-api.responsys.ocs.oraclecloud.com/rest/api/v1.3/auth/token'
      request = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `user_name=${auth.username}&password=${auth.userPassword}&auth_type=password`
      }
      console.log(request)
      let response
      try {
        response = await fetch(endpoint, request)
      } catch (err) {
        throw new Error(`***ERROR STATUS*** : ${err.message}`)
      }
      if (response.status >= 500 || response.status === 429) {
        throw new Error(
          `***ERROR STATUS*** : ${response.status} from ${endpoint}. Response : ${JSON.stringify(
            await response.json()
          )}`
        )
      }
      return await response.json()
    }
  },
  extendRequest({ auth }) {
    return {
      headers: {
        authorization: `${auth.authToken}`,
        'Content-Type': 'application/json'
      }
    }
  },

  // onDelete: async (request, { settings, payload }) => {
  //   // Return a request that performs a GDPR delete for the provided Segment userId or anonymousId
  //   // provided in the payload. If your destination does not support GDPR deletion you should not
  //   // implement this function and should remove it completely.
  // },

  actions: {
    asyncMergeProfileListMembers,
    asyncMergePetRecords
  }
}

export default destination
