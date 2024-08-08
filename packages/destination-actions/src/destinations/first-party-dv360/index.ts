import type { AudienceDestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import addToList from './addToList'

const destination: AudienceDestinationDefinition<Settings> = {
  name: 'First Party Dv360',
  slug: 'actions-first-party-dv360',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {},
    testAuthentication: (_request) => {
      return { status: 'succeeded' }
    }
  },

  audienceFields: {},

  audienceConfig: {
    mode: {
      type: 'synced',
      full_audience_sync: false
    },

    createAudience: async (_request, _createAudienceInput) => {
      return { externalId: '' }
    },

    getAudience: async (_request, _getAudienceInput) => {
      return { externalId: '' }
    }
  },

  onDelete: async (_request, _) => {
    // Return a request that performs a GDPR delete for the provided Segment userId or anonymousId
    // provided in the payload. If your destination does not support GDPR deletion you should not
    // implement this function and should remove it completely.
  },

  actions: {
    addToList
  }
}

export default destination
