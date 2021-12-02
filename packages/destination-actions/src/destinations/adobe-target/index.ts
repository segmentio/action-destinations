import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

const destination: DestinationDefinition<Settings> = {
  name: 'Adobe Target Cloud Mode',
  slug: 'actions-adobe-target-cloud',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      client_id: {
        label: 'Client ID',
        description: 'The Target client code to which the profile is associated',
        type: 'string',
        required: true
      }
    }
  },

  // onDelete: async (request, { settings, payload }) => {
  // },

  actions: {}
}

export default destination
