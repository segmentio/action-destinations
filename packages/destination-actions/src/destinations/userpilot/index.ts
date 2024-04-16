import type { DestinationDefinition } from '@segment/actions-core'
import { defaultValues } from '@segment/actions-core'

import type { Settings } from './generated-types'

import { getDeleteRequestParams, getValidationParams } from './request-utils'

import identifyUser from './identifyUser'

import trackEvent from './trackEvent'

const destination: DestinationDefinition<Settings> = {
  name: 'Userpilot Cloud (Actions)',
  slug: 'actions-userpilot-cloud',
  mode: 'cloud',
  presets: [
    {
      name: 'Identify User',
      subscribe: 'type = "identify"',
      partnerAction: 'identifyUser',
      mapping: defaultValues(identifyUser.fields),
      type: 'automatic'
    },
    {
      name: 'Track Event',
      subscribe: 'type = "track"',
      partnerAction: 'trackEvent',
      mapping: defaultValues(trackEvent.fields),
      type: 'automatic'
    }
  ],
  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'API Key',
        description:
          'Your Userpilot API key can be found in the [Userpilot environment](https://run.userpilot.io/environment) dashboard.',
        type: 'string',
        required: true
      },
      endpoint: {
        label: 'API Endpoint',
        description:
          'Your Userpilot API endpoint can be found in the [Userpilot environment](https://run.userpilot.io/environment) dashboard.',
        type: 'string',
        required: true,
        default: 'https://analytex.userpilot.io/'
      }
    },
    testAuthentication: (request, { settings }) => {
      const { url, options } = getValidationParams(settings)

      return request(url, options)
    }
  },
  extendRequest({ settings }) {
    return {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${settings.apiKey}`,
        'X-API-Version': '2020-09-22'
      }
    }
  },
  onDelete: async (request, { settings, payload }) => {
    const { userId } = payload
    const { url, options } = getDeleteRequestParams(settings, userId ?? '')

    return request(url, options)
  },

  actions: {
    identifyUser,
    trackEvent
  }
}

export default destination
