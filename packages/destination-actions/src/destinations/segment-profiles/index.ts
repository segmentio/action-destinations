import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { DEFAULT_SEGMENT_ENDPOINT, SEGMENT_ENDPOINTS } from './properties'

import sendGroup from './sendGroup'

import sendIdentify from './sendIdentify'

import sendTrack from './sendTrack'

const destination: DestinationDefinition<Settings> = {
  name: 'Segment Profiles',
  slug: 'actions-segment-profiles',
  mode: 'cloud',
  authentication: {
    scheme: 'custom',
    fields: {
      endpoint: {
        label: 'Endpoint Region',
        description: 'The region to send your data.',
        type: 'string',
        format: 'text',
        choices: Object.keys(SEGMENT_ENDPOINTS).map((key) => ({
          label: SEGMENT_ENDPOINTS[key].label,
          value: key
        })),
        default: DEFAULT_SEGMENT_ENDPOINT,
        required: true
      }
    }
  },
  actions: {
    sendGroup,
    sendIdentify,
    sendTrack
  }
}

export default destination
