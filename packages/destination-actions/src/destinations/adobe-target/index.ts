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
        label: 'Authentication Token',
        description:
          "If you choose to require authentication for Adobe Target's Profile API, you will need to generate an authentication token. Tokens can be generated in your Adobe Target account under the Implementation Settings tab or via the [Adobe.IO Authentication Token API](https://developers.adobetarget.com/api/#authentication-tokens). Input the authentication token here. Note: Authentication tokens expire so a new token will need to be generated and updated here prior to expiration.",
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
