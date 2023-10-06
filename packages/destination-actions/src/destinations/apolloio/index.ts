import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { defaultValues } from '@segment/actions-core'

import track from './track'
export const baseURL = 'https://us-central1-databricks-apolloio.cloudfunctions.net/segment-events-ingestion'
export const authURL = 'https://api.apollo.io/v1/auth/health?api_key='

const destination: DestinationDefinition<Settings> = {
  name: 'Apollo.io',
  slug: 'actions-apolloio',
  mode: 'cloud',
  description: '',

  authentication: {
    scheme: 'custom',
    fields: {
      apiToken: {
        label: 'API Token',
        description: 'API token for authorization.',
        type: 'password',
        required: true
      }
    },
    testAuthentication: (request, { settings }) => {
      return request(authURL + settings.apiToken, {
        method: 'get'
      })
    }
  },
  extendRequest({ settings }) {
    return {
      headers: {
        api_key: settings.apiToken
      }
    }
  },
  actions: {
    track
  },
  presets: [
    {
      name: 'Track',
      subscribe: 'type = "track"',
      partnerAction: 'track',
      mapping: defaultValues(track.fields),
      type: 'automatic'
    }
  ]
}

export default destination
