import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import trackEvent from './trackEvent'

import identify from './identify'

const destination: DestinationDefinition<Settings> = {
  name: 'Canvas',
  slug: 'actions-canvas',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      api_token: {
        label: 'API Token',
        description: 'API token generated by Canvas',
        type: 'string'
      }
    },
    testAuthentication: (request) => {
      return request(`https://z17lngdoxi.execute-api.us-west-2.amazonaws.com/Prod/auth`)
    }
  },
  extendRequest({ settings }) {
    if (settings.api_token) {
      return {
        headers: {
          Authorization: `Bearer ${settings.api_token}`
        }
      }
    }
    return {}
  },

  actions: {
    trackEvent,
    identify
  }
}

export default destination
