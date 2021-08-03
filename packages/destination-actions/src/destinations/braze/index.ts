import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import updateUserProfile from './updateUserProfile'

const destination: DestinationDefinition<Settings> = {
  name: 'Braze Cloud Mode',
  slug: 'actions-braze-cloud',
  mode: 'cloud',
  description: 'Send events server-side to the Braze REST API.',
  authentication: {
    scheme: 'custom',
    fields: {
      api_key: {
        label: 'API Key',
        description: 'Created under Developer Console in the Braze Dashboard.',
        type: 'string',
        required: true
      },
      endpoint: {
        label: 'REST Endpoint',
        description: 'Your Braze REST endpoint. [See more details](https://www.braze.com/docs/api/basics/#endpoints)',
        type: 'string',
        format: 'uri',
        required: true
      }
    },
    testAuthentication: (_request) => {
      // Return a request that tests/validates the user's authentication fields here
      // TODO explore docs for side-effect free way to handle this
    }
  },
  extendRequest({ settings }) {
    return {
      headers: {
        Authorization: `Bearer ${settings.api_key}`
      }
    }
  },
  actions: {
    updateUserProfile
  }
}

export default destination
