import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import customEvents from './customEvents'

import setAttributes from './setAttributes'

import manageTags from './manageTags'

const destination: DestinationDefinition<Settings> = {
  name: 'Airship',
  slug: 'actions-airship',
  mode: 'cloud',
  description: 'Activate your Airship audience from Segment',
  authentication: {
    scheme: 'custom',
    fields: {
      api_key: {
        label: 'Access Token',
        description: 'Create in the Airship Go dashboard in Settings->Partner Integrations->Segment',
        type: 'password',
        default: process.env.DEFAULT_ACCESS_TOKEN,
        required: true
      },
      app_id: {
        label: 'App Key',
        description: 'The App Key identifies the Airship Project to which API requests are made.',
        type: 'string',
        default: process.env.DEFAULT_APP_KEY,
        required: true
      },
      endpoint: {
        label: 'Data Center',
        description: 'US or EU',
        type: 'string',
        format: 'uri',
        choices: [
          { label: 'US	(https://go.urbanairship.com)', value: 'https://go.urbanairship.com' },
          { label: 'EU	(https://go.airship.eu)', value: 'https://go.airship.eu' }
        ],
        default: 'https://go.urbanairship.com',
        required: true
      }
    },
    testAuthentication: (request, { settings }) => {
      return request(`${settings.endpoint}/api/custom-events/`, {
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

  onDelete: async (request, { settings, payload }) => {
    return request(`${settings.endpoint}/api/named_users/uninstall`, {
      method: 'post',
      json: {
        named_user_id: [payload.userId]
      }
    })
  },
  extendRequest({ settings }) {
    return {
      headers: {
        Authorization: `Bearer ${settings.api_key}`,
        'X-UA-Appkey': `${settings.app_id}`,
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
