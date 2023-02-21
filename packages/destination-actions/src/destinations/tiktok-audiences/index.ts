import type { DestinationDefinition } from '@segment/actions-core'
// import { InvalidAuthenticationError } from '@segment/actions-core'
import type { Settings } from './generated-types'
import addUser from './addUser'
import removeUser from './removeUser'

const destination: DestinationDefinition<Settings> = {
  name: 'TikTok Audiences',
  slug: 'actions-tiktok-audiences',
  mode: 'cloud',

  authentication: {
    scheme: 'oauth2',
    fields: {
      advertiser_ids: {
        label: 'TikTok Advertiser IDs',
        description: 'The Advertiser IDs where audiences should be synced.',
        type: 'string',
        required: true,
        multiple: true
      }
    }
    // testAuthentication: (request, { auth }) => {
    //   if (!auth?.accessToken) {
    //     throw new InvalidAuthenticationError(
    //       'Please authenticate via Oauth before updating other settings and/or enabling the destination.'
    //     )
    //   }

    // }
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
