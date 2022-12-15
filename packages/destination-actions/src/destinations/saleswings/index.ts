import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

const destination: DestinationDefinition<Settings> = {
  name: 'Saleswings (actions)',
  slug: 'actions-saleswings',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'API Key',
        description: 'Created in your project settings in SalesWings',
        type: 'password',
        required: true
      }
    }
  },

  actions: {}
}

export default destination
