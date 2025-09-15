import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { IntegrationError, defaultValues } from '@segment/actions-core'

import track from './track'
export const baseURL = process?.env?.ACTIONS_APOLLOIO_BASE_URL_SECRET ?? 'https://apollo.io/'
export const authURL = process?.env?.ACTIONS_APOLLOIO_AUTH_URL_SECRET ?? 'https://apollo.io/'
export const headerSecret = `${process.env.ACTIONS_APOLLOIO_HEADER_SECRET}`

const destination: DestinationDefinition<Settings> = {
  name: 'Apollo.io',
  slug: 'actions-apolloio',
  mode: 'cloud',
  description: 'Send Segment analytics events to Apollo.io',

  authentication: {
    scheme: 'custom',
    fields: {
      apiToken: {
        label: 'API Token',
        description: 'API Token for authorization.',
        type: 'password',
        required: true
      }
    },
    testAuthentication: (request, { settings }) => {
      return request(authURL + settings.apiToken).then(async (response) => {
        const { is_logged_in } = await response.json()
        if (is_logged_in === false) {
          throw new IntegrationError(`Invalid API Token`, 'INVALID_API_TOKEN', 401)
        }
      })
    }
  },
  extendRequest({ settings }) {
    return {
      headers: {
        api_key: settings.apiToken,
        secret: headerSecret
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
