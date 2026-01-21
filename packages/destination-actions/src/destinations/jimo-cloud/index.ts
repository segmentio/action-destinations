import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import sendUserdata from './sendUserdata'
import { TEST_URL } from './constants'

const destination: DestinationDefinition<Settings> = {
  name: 'Jimo Cloud (actions)',
  slug: 'actions-jimo-cloud',
  mode: 'cloud',
  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'API Key',
        description: 'Your Jimo API key.',
        type: 'password',
        required: true
      }
    },
    testAuthentication: (request) => {
      return request(TEST_URL, {
        method: 'get'
      })
    }
  },
  extendRequest: ({ settings }) => {
    return {
      headers: { Authorization: `${settings.apiKey}` }
    }
  },
  actions: {
    sendUserdata
  }
}

export default destination
