/**
 * Collab Travel CRM - Segment Destination
 * 
 * This is the "Driver" code to submit to segmentio/action-destinations repository.
 * It defines how Segment communicates with the Collab Travel CRM webhook.
 * 
 * Repository: https://github.com/segmentio/action-destinations
 * Path: packages/destination-actions/src/destinations/collab-travel-crm/
 */

import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import trackEvent from './trackEvent'
import identifyUser from './identifyUser'

const COLLAB_CRM_BASE_URL = 'https://wvjaseexkfrcahmzfxkl.supabase.co/functions/v1'

const destination: DestinationDefinition<Settings> = {
  name: 'Collab Travel CRM',
  slug: 'collab-travel-crm',
  mode: 'cloud',

  description: 'Sync your customer data, bookings, and leads with Collab Travel CRM - the all-in-one platform for modern travel agencies.',

  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'API Key',
        description: 'Your Collab Travel CRM webhook secret. Find this in Settings > Integrations > Segment.',
        type: 'password',
        required: true
      }
    },
    testAuthentication: async (request, { settings }) => {
      // Send a test request to verify the API key is valid
      const response = await request(`${COLLAB_CRM_BASE_URL}/segment-destination`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${settings.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'track',
          event: '__segment_test__',
          properties: {
            test: true
          }
        })
      })
      return response
    }
  },

  extendRequest({ settings }) {
    return {
      headers: {
        'Authorization': `Bearer ${settings.apiKey}`,
        'Content-Type': 'application/json'
      }
    }
  },

  actions: {
    trackEvent,
    identifyUser
  },

  presets: [
    {
      name: 'Track Events',
      subscribe: 'type = "track"',
      partnerAction: 'trackEvent',
      mapping: {
        eventName: { '@path': '$.event' },
        properties: { '@path': '$.properties' },
        userId: { '@path': '$.userId' },
        anonymousId: { '@path': '$.anonymousId' },
        timestamp: { '@path': '$.timestamp' }
      },
      type: 'automatic'
    },
    {
      name: 'Identify Users',
      subscribe: 'type = "identify"',
      partnerAction: 'identifyUser',
      mapping: {
        email: { '@path': '$.traits.email' },
        firstName: { '@path': '$.traits.firstName' },
        lastName: { '@path': '$.traits.lastName' },
        phone: { '@path': '$.traits.phone' },
        userId: { '@path': '$.userId' },
        traits: { '@path': '$.traits' }
      },
      type: 'automatic'
    }
  ]
}

export default destination
