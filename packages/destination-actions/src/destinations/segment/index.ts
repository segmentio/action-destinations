import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import sendIdentify from './sendIdentify'
import sendGroup from './sendGroup'
import sendScreen from './sendScreen'
import sendPage from './sendPage'
import sendTrack from './sendTrack'

import { DEFAULT_SEGMENT_ENDPOINT, DEFAULT_SEGMENT_ENVIRONMENT, STAGE_ENDPOINTS } from './properties'

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
      }
    },
    testAuthentication: async (request, { settings }) => {
      const { source_write_key } = settings
      const ENV = process.env['NODE_ENV'] || DEFAULT_SEGMENT_ENVIRONMENT
      const AWS_REGION = process.env['AWS_REGION'] || DEFAULT_SEGMENT_ENDPOINT
      if (ENV == 'staging') {
        return request(`${STAGE_ENDPOINTS[AWS_REGION].cdn}/projects/${source_write_key}/settings`)
      }
      return request(`${STAGE_ENDPOINTS[AWS_REGION].cdn}/projects/${source_write_key}/settings`)
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
    sendIdentify,
    sendGroup,
    sendScreen,
    sendPage,
    sendTrack
  }
}

export default destination
