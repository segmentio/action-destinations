import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import event from './event'
import profile from './profile'

const destination: DestinationDefinition<Settings> = {
  name: 'Antavo (Actions)',
  slug: 'actions-antavo',
  mode: 'cloud',
  authentication: {
    scheme: 'custom',
    fields: {
      stack: {
        label: 'Stack',
        description: 'The Antavo Loyalty Engine stack where your brand resides',
        type: 'string',
        required: true
      },
      api_key: {
        label: 'API Key',
        description: 'The Antavo brand API key supplied to your brand in Antavo Loyalty Engine',
        type: 'password',
        required: true
      }
    }
  },
  actions: {
    event,
    profile
  }
}

export default destination
