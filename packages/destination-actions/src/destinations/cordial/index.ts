import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import identify from './identify'
import group from './group'
import track from './track'
import page from './page'

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
        description:
          "Cordial Segment integration endpoint. Leave default, unless you've been provided with another one",
        type: 'string',
        required: true,
        default: 'https://integrations.cordial.io/segment'
      }
    },
    testAuthentication: (request, { settings }) => {
      return request(settings.endpoint, {
        username: settings.apiKey,
        method: 'post',
        throwHttpErrors: false
      }).then((response) => {
        return response?.status === 400 && response?.content === '{"message":"Incompatible type"}'
          ? true
          : Promise.reject({
              message: response?.content ?? 'unknown error',
              response: { status: response?.status ?? 'unknown status' }
            })
      });
    }
  },

  extendRequest({ settings }) {
    return { username: settings.apiKey }
  },

  actions: {
    identify,
    group,
    track,
    page
  }
}

export default destination
