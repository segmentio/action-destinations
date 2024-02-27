import type { DestinationDefinition } from '@segment/actions-core'
import { IntegrationError } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { defaultValues } from '@segment/actions-core'

import { getEndpointByRegion } from './regional-endpoints'
import sendEvent from './sendEvent'

const defaultVals = { ...defaultValues(sendEvent.fields) }

const destination: DestinationDefinition<Settings> = {
  name: 'Gainsight Px Cloud (Actions)',
  slug: 'actions-gainsight-px-cloud',
  mode: 'cloud',

  authentication: {
    scheme: 'basic',
    fields: {
      apiKey: {
        label: 'API Key',
        description: 'Gainsight PX API key. You can find this key in the "Administration/Products" screen.',
        type: 'string',
        required: true
      },
      dataCenter: {
        label: 'Data center',
        description: 'The PX data center where your PX subscription is hosted.',
        type: 'string',
        format: 'text',
        required: true,
        choices: [
          {
            label: 'North America',
            value: 'north_america'
          },
          {
            label: 'Europe',
            value: 'europe'
          },
          {
            label: 'US2',
            value: 'us2'
          }
        ]
      }
    },
    testAuthentication: async (request, { settings }) => {
      const endpoint = getEndpointByRegion('track', settings.dataCenter)
      const response = await request(endpoint, {
        method: 'post',
        username: settings.apiKey,
        password: '',
        json: [],
        throwHttpErrors: false
      })

      // An empty post body will return a 400 response whereas a bad token will return a 401.
      if (response.status === 400) {
        return true
      }
      throw new IntegrationError('Invalid API key', 'Invalid API Key', 401)
    }
  },
  extendRequest({ settings }) {
    return {
      username: settings.apiKey,
      password: ''
    }
  },
  actions: {
    // Only one action, event data is simply copied from Segment payload and sent to Gainsight PX
    sendEvent
  },
  presets: [
    {
      name: 'Identify User',
      subscribe: 'type = "identify"',
      partnerAction: 'sendEvent',
      mapping: defaultVals,
      type: 'automatic'
    },
    {
      name: 'Group User',
      subscribe: 'type = "group"',
      partnerAction: 'sendEvent',
      mapping: defaultVals,
      type: 'automatic'
    },
    {
      name: 'Track Event',
      subscribe: 'type = "track"',
      partnerAction: 'sendEvent',
      mapping: defaultVals,
      type: 'automatic'
    },
    {
      name: 'Track Page View',
      subscribe: 'type = "page"',
      partnerAction: 'sendEvent',
      mapping: defaultVals,
      type: 'automatic'
    }
  ]
}

export default destination
