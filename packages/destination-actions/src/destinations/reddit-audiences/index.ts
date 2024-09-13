import type { AudienceDestinationDefinition } from '@segment/actions-core'
import type { Settings, AudienceSettings } from './generated-types'
import { AuthSettings, RequestOptions } from './types'
import { setAccessToken } from './functions'

import addToAudience from './addToAudience'

import createAudience from './createAudience'

import deleteFromAudience from './deleteFromAudience'

// For an example audience destination, refer to webhook-audiences. The Readme section is under 'Audience Support'
const destination: AudienceDestinationDefinition<Settings, AudienceSettings> = {
  name: 'Reddit Audiences',
  slug: 'actions-reddit-audiences',
  mode: 'cloud',

  authentication: {
    scheme: 'oauth-managed',
    fields: {
      ad_account_id: {
        type: 'string',
        label: 'Ad Account ID',
        description: 'Unique identifier of an ad account. This can be found in the Reddit UI.',
        required: true
      },
      client_id: {
        type: 'string',
        label: 'Client ID',
        description: 'Unique identifier of an ad account. This can be found in the Reddit UI.',
        required: true
      },
      client_secret: {
        type: 'string',
        label: 'Client Secret',
        description: 'Unique identifier of an ad account. This can be found in the Reddit UI.',
        required: true
      },
      refresh_token: {
        type: 'string',
        label: 'Refresh Token',
        description: 'Unique identifier of an ad account. This can be found in the Reddit UI.',
        required: true
      }
    },

    // comment out below for now and go back to it
    // testAuthentication: (request) => {
    //   // Return a request that tests/validates the user's credentials.
    //   // If you do not have a way to validate the authentication fields safely,
    //   // you can remove the `testAuthentication` function, though discouraged.
    // },

    refreshAccessToken: async (request: (url: string, options?: RequestOptions) => Promise<any>, { auth }: { auth: AuthSettings }) => {
      // Return a request that refreshes the access_token if the API supports it
      const baseUrl = 'https://www.reddit.com/api/v1/access_token'
      const body = `grant_type=refresh_token&refresh_token=${auth.refreshToken}`;
      const res = await request(baseUrl, {
        method: 'POST',
        username: auth.clientId,
        password: auth.clientSecret,
        body
      })
      const responseData = res.data as { access_token: string }

      setAccessToken(responseData.access_token);
      return {
        accessToken: responseData.access_token,
      }
    }
  },

  audienceFields: {
    adAccountId: {
      label: 'An audience id required by the destination',
      description: 'An audience id required by the destination',
      type: 'string',
      required: true
    },
    audienceId: {
      label: 'An audience id required by the destination',
      description: 'An audience id required by the destination',
      type: 'string',
      required: false
    }
  },

  audienceConfig: {
    mode: {
      type: 'synced', // Indicates that the audience is synced on some schedule; update as necessary
      full_audience_sync: false // If true, we send the entire audience. If false, we just send the delta.
    },

  },

  actions: {
    addToAudience,
    createAudience,
    deleteFromAudience
  }
}


export default destination;
