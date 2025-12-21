import { DestinationDefinition, defaultValues } from '@segment/actions-core'
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
      mapping: defaultValues(trackEvent.fields),
      type: 'automatic'
    },
    {
      name: 'Identify Users',
      subscribe: 'type = "identify"',
      partnerAction: 'identifyUser',
      mapping: defaultValues(identifyUser.fields),
      type: 'automatic'
    }
  ]
}

export default destination
