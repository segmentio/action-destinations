import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import updateProfile from './updateProfile'

const destination: DestinationDefinition<Settings> = {
  name: 'Adobe Target Cloud Mode',
  slug: 'actions-adobe-target-cloud',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      client_code: {
        label: 'Client Code',
        description:
          'Your Adobe Target client code. To find your client code in Adobe Target, navigate to **Administration > Implementation**. The client code is shown at the top under Account Details.',
        type: 'string',
        required: true
      },
      bearer_token: {
        label: 'Bearer Token',
        description:
          "Self managed bearer token generated via [Adobe's authentication API](https://developers.adobetarget.com/api/#authentication-tokens). Expires every 90 days.",
        type: 'string'
      }
    }
  },
  extendRequest({ settings }) {
    if (settings.bearer_token) {
      return {
        headers: {
          Authorization: `Bearer ${settings.bearer_token}`
        }
      }
    }
    return {}
  },
  actions: {
    updateProfile
  }
}

export default destination
