import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import postToCourier from './postToCourier'
import audienceToList from './audienceToList'

const destination: DestinationDefinition<Settings> = {
  name: 'Courier (Actions)',
  slug: 'actions-courier',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'API Key',
        description: 'Courier API Key from Segment integration page in the Courier Designer.',
        type: 'password',
        required: true
      },
      region: {
        label: 'Region',
        description: 'Courier Region (US or EU)',
        type: 'string',
        default: 'US',
        choices: [
          {
            value: 'US',
            label: 'US'
          },
          {
            value: 'EU',
            label: 'EU'
          }
        ],
        required: true
      }
    },
    testAuthentication: (request, { settings }) => {
      const domain = getDomain(settings.region)
      return request(`${domain}/debug`, { method: 'POST', headers: { Authorization: `Bearer ${settings.apiKey}` } })
    }
  },
  actions: {
    postToCourier,
    audienceToList
  },
  extendRequest({ settings }) {
    return {
      headers: {
        Authorization: `Bearer ${settings.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'SegmentCourier'
      }
    }
  }
}

export const getDomain = (region: string) => `https://api.${region === 'EU' ? 'eu.' : ''}courier.com`

export default destination
