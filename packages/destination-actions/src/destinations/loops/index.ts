import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import createOrUpdateContact from './createOrUpdateContact'
import sendEvent from './sendEvent'

const destination: DestinationDefinition<Settings> = {
  name: 'Loops (Actions)',
  slug: 'actions-loops',
  mode: 'cloud',

  extendRequest: ({ settings }) => {
    return {
      headers: { Authorization: `Bearer ${settings.apiKey}`, 'Content-Type': 'application/json' }
    }
  },

  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'API Key',
        description: 'Your Loops API Key',
        type: 'string',
        required: true
      }
    },
    testAuthentication: (request) => {
      return request(`${LOOPS_BASE_URL}/api-key`, { method: 'GET' })
    }
  },

  actions: {
    createOrUpdateContact,
    sendEvent
  },
  onDelete: async (request, { payload }) => {
    return request(`${LOOPS_BASE_URL}/contacts/delete`, {
      method: 'POST',
      json: {
        userId: [payload.userId]
      }
    })
  }
}

export default destination
