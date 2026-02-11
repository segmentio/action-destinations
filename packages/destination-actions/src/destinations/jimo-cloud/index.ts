import type { DestinationDefinition } from '@segment/actions-core'
import { buildJimoUrl, JIMO_TEST_PATH } from './constants'
import type { Settings } from './generated-types'
import sendUserdata from './sendUserdata'

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
      return request(buildJimoUrl(JIMO_TEST_PATH), {
        method: 'get'
      })
    }
  },
  extendRequest: ({ settings }) => {
    return {
      headers: { Authorization: `Bearer ${settings.apiKey}` }
    }
  },
  actions: {
    sendUserdata
  }
}

export default destination
