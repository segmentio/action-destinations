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
        description: 'Antavo stack',
        type: 'string',
        required: true
      },
      api_key: {
        label: 'API Key',
        description: 'Antavo brand API key',
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
