import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { DEFAULT_SEGMENT_ENDPOINT, SEGMENT_ENDPOINTS } from './properties'

import sendGroup from './sendGroup'

import sendIdentify from './sendIdentify'

const destination: DestinationDefinition<Settings> = {
  name: 'Segment Profiles',
  slug: 'actions-segment-profiles',
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
    },
    testAuthentication: async (request, { settings }) => {
      const { source_write_key, endpoint } = settings

      return request(
        `${SEGMENT_ENDPOINTS[endpoint || DEFAULT_SEGMENT_ENDPOINT].cdn}/projects/${source_write_key}/settings`
      )
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
    sendIdentify
  }
}

export default destination
