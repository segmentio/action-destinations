import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import sendEvent from './sendEvent'
import sendPageview from './sendPageview'
import sendUserData from './sendUserData'
//import { InvalidAuthenticationError } from '@segment/actions-core'

const destination: DestinationDefinition<Settings> = {
  name: '1plusX',
  mode: 'cloud',
  //No authentication required for 1PlusX Data Collection API
  authentication: {
    scheme: 'custom',
    fields: {
      client_id: {
        label: 'Client ID',
        description: 'Your 1PlusX Client ID.',
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
    },
    testAuthentication: (_request) => {
      //1PlusX does not have a side effect free API
      //We will return true for now since this is a required argument
      return true
    }
  },
  actions: {
    sendEvent,
    sendPageview,
    sendUserData
  }
}

export default destination
