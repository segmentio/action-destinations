import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import identifyContact from './identifyContact'
import groupIdentifyContact from './groupIdentifyContact'
import trackEvent from './trackEvent'

const destination: DestinationDefinition<Settings> = {
  name: 'Intercom (Actions)',
  slug: 'actions-intercom',
  mode: 'cloud',

  authentication: {
    scheme: 'oauth2',
    fields: {},
    testAuthentication: (request) => {
      // Uses the admin route as a stand-in to test authentication creds.
      // Should be a light request since there most likely won't be many admins
      return request('https://api.intercom.io/admins')
    }
  },
  extendRequest({ auth }) {
    return {
      headers: {
        authorization: `Bearer ${auth?.accessToken}`
      }
    }
  },

  onDelete: async (request, { payload }) => {
    return request(`https://api.intercom.io/contacts/${payload.userId}`, {
      method: 'DELETE'
    })
  },

  actions: {
    identifyContact,
    groupIdentifyContact,
    trackEvent
  }
}

export default destination
