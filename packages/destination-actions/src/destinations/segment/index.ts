import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import sendGroup from './sendGroup'

import sendScreen from './sendScreen'

const destination: DestinationDefinition<Settings> = {
  //Needs to be updated when name & slug are finalized
  name: 'Segment',
  slug: 'actions-segment',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      source_write_key: {
        label: 'Source Write Key',
        description: 'TODO',
        type: 'string',
        required: true
      },
      endpoint: {
        label: 'Endpoint Region',
        description: 'The region to send your data.',
        type: 'string',
        format: 'text',
        choices: [
          {
            label: 'North America',
            value: 'north_america'
          },
          {
            label: 'Europe',
            value: 'europe'
          }
        ],
        default: 'north_america'
      }
    }
  },
  extendRequest({ settings }) {
    return {
      headers: {
        authorization: `Basic ${Buffer.from(settings.source_write_key + ':').toString('base64')}`
      }
    }
  },
  actions: {
    sendGroup,
    sendScreen
  }
}

export default destination
