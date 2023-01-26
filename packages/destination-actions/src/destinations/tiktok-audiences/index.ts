import type { DestinationDefinition } from '@segment/actions-core'
// import { InvalidAuthenticationError } from '@segment/actions-core'
import type { Settings } from './generated-types'

import updateAudience from './updateAudience'

const destination: DestinationDefinition<Settings> = {
  name: 'TikTok Audiences',
  slug: 'actions-tiktok-audiences',
  mode: 'cloud',

  authentication: {
    scheme: 'oauth2',
    fields: {
      advertiser_id: {
        label: 'TikTok Advertiser ID',
        description: 'The Advertiser ID where audiences should be synced.',
        type: 'string',
        required: true
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
      headers: { 'Access-Token': `${auth?.accessToken}` }
    }
  },

  actions: {
    updateAudience
  }
}

export default destination
