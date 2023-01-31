import { DestinationDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings } from './generated-types'
import identifyContact from './identifyContact'
import groupIdentifyContact from './groupIdentifyContact'
import trackEvent from './trackEvent'
import { getUniqueIntercomContact } from './util'

const destination: DestinationDefinition<Settings> = {
  name: 'Intercom Cloud Mode (Actions)',
  slug: 'actions-intercom-cloud-change',
  mode: 'cloud',

  authentication: {
    scheme: 'oauth2',
    fields: {},
    testAuthentication: async (request) => {
      // Uses the admin route as a stand-in to test authentication creds.
      // Should be a light request since there most likely won't be many admins
      try {
        return await request('https://api.intercom.io/admins')
      } catch (error) {
        throw new Error('Test authentication failed')
      }
    }
  },
  extendRequest({ auth }) {
    return {
      headers: {
        authorization: `Bearer ${auth?.accessToken}`
      }
    }
  },

  /**
   * We search for a unique contact using the userId as the exteralId and then delete. If a contact
   * is not found, throw a 404
   */
  onDelete: async (request, { payload }) => {
    const external_id = payload.userId as string
    const contact = await getUniqueIntercomContact(request, { external_id })
    if (contact) {
      return request(`https://api.intercom.io/contacts/${payload.userId}`, {
        method: 'DELETE'
      })
    } else {
      throw new IntegrationError('No unique contact found', 'Contact not found', 404)
    }
  },

  actions: {
    identifyContact,
    groupIdentifyContact,
    trackEvent
  }
}

export default destination
