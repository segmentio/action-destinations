import type { Settings } from './generated-types'

import submitMeasurements from './submitMeasurements'
import getAccessToken from './auth'
import { USER_AGENT_HEADER } from './constants'
import { defaultValues, DestinationDefinition } from '@segment/actions-core'

const destination: DestinationDefinition<Settings> = {
  name: 'm3ter',
  slug: 'actions-m3ter',
  mode: 'cloud',

  authentication: {
    scheme: 'oauth2',
    fields: {
      access_key_id: {
        label: 'm3ter Access Key Id',
        description:
          'Your service user Access Key Id. You can generate the service user and its Access Key Id in your m3ter console under "Settings" -> "Access" -> "Service Users" -> "Create Service User".' +
          ' Step by step guide can be found in [m3ter Docs](https://www.m3ter.com/docs/guides/authenticating-with-the-platform/service-authentication#generating-an-api-key-and-secret-for-a-service-user)',
        type: 'string',
        required: true
      },
      api_secret: {
        label: 'm3ter Api Secret',
        description:
          'Your service user Api Secret. You can generate the service user and its Api Secret in your m3ter console under "Settings" -> "Access" -> "Service Users" -> "Create Service User".' +
          ' Step by step guide can be found in [m3ter Docs](https://www.m3ter.com/docs/guides/authenticating-with-the-platform/service-authentication#generating-an-api-key-and-secret-for-a-service-user)',
        type: 'password',
        required: true
      },
      org_id: {
        label: 'm3ter Organization Id',
        description: 'ID of your organization where your data will be submitted to',
        type: 'string',
        required: true
      }
    },
    testAuthentication: async (request, { settings }) => {
      const accessToken = await getAccessToken(request, settings.access_key_id, settings.api_secret)
      return { accessToken: accessToken }
    },
    refreshAccessToken: async (request, { settings }) => {
      const accessToken = await getAccessToken(request, settings.access_key_id, settings.api_secret)
      return { accessToken: accessToken }
    }
  },
  extendRequest({ auth }) {
    return {
      headers: {
        Authorization: `Bearer ${auth?.accessToken}`,
        'User-Agent': USER_AGENT_HEADER
      }
    }
  },
  actions: {
    submitMeasurements
  },
  presets: [
    {
      name: 'Submit usage data to m3ter',
      subscribe: submitMeasurements.defaultSubscription as string,
      partnerAction: 'submitMeasurements',
      mapping: defaultValues(submitMeasurements.fields),
      type: 'automatic'
    }
  ]
}

export default destination
