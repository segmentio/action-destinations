import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import { defaultValues } from '@segment/actions-core'

import { getEndpointByRegion } from './regional-endpoints'
import identifyUser from './identifyUser'
import groupIdentify from './groupIdentify'
import trackEvent from './trackEvent'
import trackPageView from './trackPageView'

/** used in the quick setup */
const presets: DestinationDefinition['presets'] = [
  {
    name: 'Identify User',
    subscribe: 'type = "identify"',
    partnerAction: 'identifyUser',
    mapping: defaultValues(identifyUser.fields)
  },
  {
    name: 'Group User',
    subscribe: 'type = "group"',
    partnerAction: 'groupIdentify',
    mapping: defaultValues(groupIdentify.fields)
  },
  {
    name: 'Track Event',
    subscribe: 'type = "track"',
    partnerAction: 'trackEvent',
    mapping: defaultValues(trackEvent.fields)
  },
  {
    name: 'Track Page View',
    subscribe: 'type = "page"',
    partnerAction: 'trackPageView',
    mapping: defaultValues(trackPageView.fields)
  }
]

const destination: DestinationDefinition<Settings> = {
  name: 'Gainsight Px Cloud Action',
  slug: 'gainsight-px-cloud-action',
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
      throw new Error('Invalid API Key')
    }
  },
  extendRequest({ settings }) {
    return {
      username: settings.apiKey,
      password: ''
    }
  },
  presets,
  actions: {
    identifyUser,
    groupIdentify,
    trackEvent,
    trackPageView
  }
}

export default destination
