import { DestinationDefinition, defaultValues } from '@segment/actions-core'
import type { Settings } from './generated-types'

import customEvents from './customEvents'

import setAttributes from './setAttributes'

import manageTags from './manageTags'

import { map_endpoint } from './utilities'

const destination: DestinationDefinition<Settings> = {
  name: 'Airship (Actions)',
  slug: 'actions-airship',
  mode: 'cloud',
  description:
    'Send events from Segment to Airship for message triggering, audience targeting, personalization, and analytics.',
  authentication: {
    scheme: 'custom',
    fields: {
      access_token: {
        label: 'Access Token',
        description: 'Create in the Airship Go dashboard in Settings->Partner Integrations->Segment',
        type: 'password',
        // default: process.env.DEFAULT_ACCESS_TOKEN,
        required: true
      },
      app_key: {
        label: 'App Key',
        description: 'The App Key identifies the Airship Project to which API requests are made.',
        type: 'string',
        // default: process.env.DEFAULT_APP_KEY,
        required: true
      },
      endpoint: {
        label: 'Data Center',
        description: 'US or EU',
        type: 'string',
        choices: [
          { label: 'US', value: 'US' },
          { label: 'EU', value: 'EU' }
        ],
        default: 'US',
        required: true
      }
    },
    testAuthentication: (request, { settings }) => {
      const endpoint = map_endpoint(settings.endpoint)
      return request(`${endpoint}/api/custom-events/`, {
        method: 'post',
        json: {
          body: {
            name: 'test_segment_auth'
          },
          user: {
            named_user_id: '549ce761-56c9-4899-9026-816d0c3bffd1'
          }
        }
      })
    }
  },
  presets: [
    {
      name: 'Custom Events',
      subscribe: 'type = "track"',
      partnerAction: 'customEvents',
      mapping: defaultValues(customEvents.fields),
      type: 'automatic'
    },
    {
      name: 'Set Attributes',
      subscribe: 'type = "identify"',
      partnerAction: 'setAttributes',
      mapping: defaultValues(setAttributes.fields),
      type: 'automatic'
    }
  ],
  onDelete: async (request, { settings, payload }) => {
    const endpoint = map_endpoint(settings.endpoint)
    return request(`${endpoint}/api/named_users/uninstall`, {
      method: 'post',
      json: {
        named_user_id: [payload.userId]
      }
    })
  },
  extendRequest({ settings }) {
    return {
      headers: {
        Authorization: `Bearer ${settings.access_token}`,
        'X-UA-Appkey': `${settings.app_key}`,
        Accept: 'application/vnd.urbanairship+json; version=3',
        'Content-Type': 'application/json'
      }
    }
  },
  actions: {
    customEvents,
    setAttributes,
    manageTags
  }
}
export default destination
