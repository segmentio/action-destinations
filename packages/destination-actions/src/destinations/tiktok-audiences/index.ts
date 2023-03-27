import type { DestinationDefinition } from '@segment/actions-core'
import { InvalidAuthenticationError } from '@segment/actions-core'
import type { Settings } from './generated-types'
import addUser from './addUser'
import removeUser from './removeUser'
import { TikTokAudiences } from './api'
import { ModifiedResponse } from '@segment/actions-core'
import { APIResponse } from './types'

const destination: DestinationDefinition<Settings> = {
  name: 'TikTok Audiences',
  slug: 'actions-tiktok-audiences',
  mode: 'cloud',

  authentication: {
    scheme: 'oauth2',
    fields: {
      advertiser_ids: {
        label: 'TikTok Advertiser IDs',
        description:
          'The Advertiser IDs where audiences should be synced. Hidden in production and should not be altered by users.',
        type: 'string',
        required: true,
        multiple: true
      }
    },
    testAuthentication: async (request, { auth }) => {
      if (!auth?.accessToken) {
        throw new InvalidAuthenticationError(
          'Please authenticate via Oauth before updating other settings and/or enabling the destination.'
        )
      }

      const TikTokApiClient: TikTokAudiences = new TikTokAudiences(request)

      const response: ModifiedResponse<APIResponse> = await TikTokApiClient.getUserInfo()

      // Since the API will return 200 we need to parse the response to see if it failed.

      if (response.data.code !== 0) {
        throw new Error(
          'Invalid Oauth access token. Please reauthenticate to retrieve a valid access token before updating other settings and/or enabling the destination.'
        )
      }
    }
  },
  extendRequest({ auth }) {
    return {
      headers: {
        'Access-Token': `${auth?.accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  },

  actions: {
    addUser,
    removeUser
  }
}

export default destination
