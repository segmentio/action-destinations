import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import createContactactivity from './createContactactivity'

const destination: DestinationDefinition<Settings> = {
  name: 'Cordial',
  description: 'Sync Segment Users, Groups and Events to Cordial',
  slug: 'actions-cordial',
  mode: 'cloud',

  authentication: {
    scheme: 'basic',
    fields: {
      apiKey: {
        label: 'API Key',
        description: 'Your Cordial API Key',
        type: 'string',
        required: true
      },
      endpoint: {
        label: 'Endpoint',
        description: "Cordial API endpoint. Leave default, unless you've been provided with another one",
        type: 'string',
        required: true,
        default: 'https://api.cordial.io'
      }
    },
    testAuthentication: (request, { settings }) => {
      return request(settings.endpoint + '/v2/health')
    }
  },

  extendRequest({ settings }) {
    return { username: settings.apiKey }
  },

  actions: {
    createContactactivity
  }
}

export default destination
