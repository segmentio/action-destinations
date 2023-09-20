import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import updateUserProfile from './updateUserProfile'
import { defaultValues } from '@segment/actions-core'

import trackEvent from './trackEvent'
import { getEndpoint } from './utilities'

const destination: DestinationDefinition<Settings> = {
  name: 'Pushwoosh',
  slug: 'actions-pushwoosh',
  mode: 'cloud',
  description:
    'Pushwoosh(https://www.pushwoosh.com) provides a customer engagement platform for mobile apps and websites and brings together all essential communication tools within one platform.' +
    'Through the integration with Segment, Pushwoosh can leverage the comprehensive customer data collected, ensuring highly personalized and effective communication strategies.',
  authentication: {
    scheme: 'custom',
    fields: {
      pushwooshAPIKey: {
        label: 'Pushwoosh API Key',
        description: 'Pushwoosh API Key from Pushwoosh Control Panel',
        type: 'password',
        required: true
      },
      pushwooshAppCode: {
        label: 'Pushwoosh Application Code',
        description: 'Pushwoosh Application Code from Pushwoosh Control Panel',
        type: 'string',
        required: true
      }
    },

    testAuthentication: (request) => {
      const endpoint = getEndpoint('/integration-segment/v1/ping')
      return request(endpoint, {
        method: 'post',
        json: {
          body: {
            name: 'test_segment_auth'
          }
        }
      })
    }
  },

  presets: [
    {
      name: 'Track Events',
      subscribe: 'type = "track" or type = "page" or type = "screen"',
      partnerAction: 'trackEvent',
      mapping: defaultValues(trackEvent.fields),
      type: 'automatic'
    },
    {
      name: 'Create or Update User Profile',
      subscribe: 'type = "identify"',
      partnerAction: 'updateUserProfile',
      mapping: defaultValues(updateUserProfile.fields),
      type: 'automatic'
    }
  ],

  onDelete: async (request, { payload }) => {
    const endpoint = getEndpoint('/integration-segment/v1/delete-user')
    return request(endpoint, {
      method: 'post',
      json: {
        external_id: payload.userId
      }
    })
  },

  extendRequest({ settings }) {
    return {
      headers: {
        Authorization: `Token ${settings.pushwooshAPIKey}`,
        'X-PW-Appcode': `${settings.pushwooshAppCode}`
      }
    }
  },

  actions: {
    updateUserProfile,
    trackEvent
  }
}

export default destination
