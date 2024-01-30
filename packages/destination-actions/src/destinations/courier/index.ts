import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import postToCourier from './postToCourier'

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
    }
  },
  actions: {
    postToCourier
  }
}

export default destination
