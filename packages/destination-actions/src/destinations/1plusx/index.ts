import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import sendEvent from './sendEvent'
import sendPageview from './sendPageview'
import sendUserData from './sendUserData'

const destination: DestinationDefinition<Settings> = {
  name: '1plusX',
  mode: 'cloud',
  //No authentication required for 1plusX Data Collection API
  authentication: {
    scheme: 'custom',
    fields: {
      client_id: {
        label: 'Client ID',
        description: 'Your 1plusX Client ID.',
        type: 'string',
        required: true
      },
      use_test_endpoint: {
        label: 'Use Test Endpoint',
        description:
          'If true, events are sent to `https://tagger-test.opecloud.com` instead of `https://tagger.opecloud.com`',
        type: 'boolean',
        default: false
      }
    }
  },
  actions: {
    sendEvent,
    sendPageview,
    sendUserData
  }
}

export default destination
