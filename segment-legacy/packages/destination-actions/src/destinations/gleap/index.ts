import { DestinationDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings } from './generated-types'
import identifyContact from './identifyContact'
import trackEvent from './trackEvent'

const destination: DestinationDefinition<Settings> = {
  name: 'Gleap (Action)',
  slug: 'gleap-cloud-actions',
  description: 'Send Segment analytics events and user profile data to Gleap',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      apiToken: {
        type: 'string',
        label: 'Secret API token',
        description: 'Found in `Project settings` -> `Secret API token`.',
        required: true
      }
    },
    testAuthentication: async (request) => {
      // The auth endpoint checks if the API token is valid
      // https://api.gleap.io/admin/auth.

      return await request('https://api.gleap.io/admin/auth')
    }
  },
  extendRequest({ settings }) {
    return {
      headers: {
        'Api-Token': settings.apiToken
      }
    }
  },

  /**
   * Delete a contact from Gleap when a user is deleted in Segment. Use the `userId` to find the contact in Gleap.
   */
  onDelete: async (request, { payload }) => {
    const userId = payload.userId as string
    if (userId) {
      return request(`https://api.gleap.io/admin/contacts/${userId}`, {
        method: 'DELETE'
      })
    } else {
      throw new IntegrationError('No unique contact found', 'Contact not found', 404)
    }
  },

  actions: {
    identifyContact,
    trackEvent
  }
}

export default destination
