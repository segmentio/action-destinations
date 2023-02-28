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
      segment_papi_token: {
        label: 'Segment Public API Token',
        description:
          'The Segment Public API requires that you have an authentication token before you send requests. [This document](https://docs.segmentapis.com/tag/Getting-Started#section/Get-an-API-token) explains how to setup a token.',
        type: 'password',
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
        default: DEFAULT_SEGMENT_ENDPOINT,
        required: true
      }
    },
    testAuthentication: async (request, { settings }) => {
      const { endpoint } = settings
      return request(SEGMENT_ENDPOINTS[endpoint || DEFAULT_SEGMENT_ENDPOINT].papi, {
        headers: {
          authorization: `Bearer ${settings.segment_papi_token}`
        }
      })
    }
  },
  actions: {
    sendGroup,
    sendIdentify
  }
}

export default destination
