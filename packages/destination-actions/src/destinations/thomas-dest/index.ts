import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import trackEvent from './trackEvent'

const destination: DestinationDefinition<Settings> = {
  name: 'Thomas Dest',
  slug: 'actions-thomas-dest',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {},
    testAuthentication: () => {
      return true
    }
  },
  extendRequest: () => {
    return {
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': 'en-US',
        'X-Custom-Header': 'foobar'
      }
    }
  },
  actions: {
    trackEvent
  }
}

export default destination
