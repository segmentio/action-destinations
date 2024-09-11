import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import syncProperties from './syncProperties'

const destination: DestinationDefinition<Settings> = {
  name: 'Postscript',
  slug: 'actions-postscript',
  description: 'Postscript data destination for Segment',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      secret_key: {
        label: 'Secret Key',
        description: 'Your Postscript API secret key',
        type: 'password',
        required: true
      }
    },
    testAuthentication: (request) => {
      return request('https://api.postscript.io/api/v2/me', {
        method: 'get'
      })
    }
  },
  extendRequest: ({ settings }) => {
    return {
      headers: {
        Authorization: `Bearer ${settings.secret_key}`,
        'Content-Type': 'application/json'
      }
    }
  },
  actions: {
    syncProperties
  }
}

export default destination
