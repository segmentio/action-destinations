import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import orderCompletionEvent from './orderCompletionEvent'

const destination: DestinationDefinition<Settings> = {
  name: 'LXR Insights',
  slug: 'actions-lxr-insights',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'API Key',
        description: 'API Key',
        type: 'string',
        required: true
      }
    },
    testAuthentication: (request) => {
      // Please update the code here for further customization
      return request('https://www.test.com', {
        method: 'get'
      })
    }
  },

  actions: {
    orderCompletionEvent
  }
}

export default destination
