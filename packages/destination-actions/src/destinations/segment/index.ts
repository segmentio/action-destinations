import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import sendScreen from './sendScreen'
import sendIdentify from './sendIdentify'
import sendGroup from './sendGroup'

import { SEGMENT_ENDPOINTS, DEFAULT_SEGMENT_ENDPOINT } from './properties'

import sendPage from './sendPage'

import sendTrack from './sendTrack'

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
        description: 'The **Write Key** of a Segment source.',
        type: 'string',
        required: true
      },
      endpoint: {
        label: 'Endpoint Region',
        description: 'The region to send your data.',
        type: 'string',
        format: 'text',
        choices: Object.keys(SEGMENT_ENDPOINTS).map((key) => ({
          label: SEGMENT_ENDPOINTS[key].label,
          value: key
        })),
        default: DEFAULT_SEGMENT_ENDPOINT
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
    sendScreen,
    sendIdentify,
    sendGroup,
    sendPage,
    sendTrack
  }
}

export default destination
