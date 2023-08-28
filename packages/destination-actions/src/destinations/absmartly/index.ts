import type { DestinationDefinition, Preset, RequestClient } from '@segment/actions-core'
import type { Settings } from './generated-types'

import trackEvent from './trackEvent'
import pageEvent from './pageEvent'
import screenEvent from './screenEvent'
import { defaultValues } from '@segment/actions-core'

const presets: Preset[] = [
  {
    name: 'Track Calls',
    subscribe: 'type = "track"',
    partnerAction: 'trackEvent',
    mapping: defaultValues(trackEvent.fields),
    type: 'automatic'
  },
  {
    name: 'Page Calls',
    subscribe: 'type = "page"',
    partnerAction: 'pageEvent',
    mapping: defaultValues(pageEvent.fields),
    type: 'automatic'
  },
  {
    name: 'Screen Calls',
    subscribe: 'type = "screen"',
    partnerAction: 'screenEvent',
    mapping: defaultValues(screenEvent.fields),
    type: 'automatic'
  }
]

const destination: DestinationDefinition<Settings> = {
  name: 'ABsmartly (Actions)',
  slug: 'actions-absmartly',
  mode: 'cloud',

  authentication: {
    scheme: 'custom',
    fields: {
      collectorEndpoint: {
        label: 'Collector Endpoint',
        description: 'ABsmartly Collector endpoint, for example: https://you-subdomain.absmartly.io/v1',
        format: 'uri',
        type: 'string',
        required: true
      },
      apiKey: {
        label: 'API Key',
        description:
          'ABsmartly SDK API Key. Create SDK Api Keys in the Settings -> API Keys section of the ABsmartly Web Console',
        type: 'string',
        required: true
      },
      environment: {
        label: 'Environment',
        description:
          'Environment name. Create Environments in the Settings -> Environments section of the ABsmartly Web Console',
        type: 'string',
        required: true
      }
    },
    testAuthentication: async (request: RequestClient, { settings }) => {
      return request(`${settings.collectorEndpoint}/context/authed`, {
        method: 'get'
      })
    }
  },

  extendRequest({ settings }) {
    return {
      headers: {
        'X-API-Key': settings.apiKey,
        'X-Environment': settings.environment,
        'Content-Type': 'application/json'
      }
    }
  },

  /*
  Not implemented in this release, but will be in the future.
  Pending questions:
    - Can we specify mappings / UI for this call as well? we need to map the userId/anonymousId to values on our platform, like we do for the other calls.
    */
  // onDelete: async (request, { settings, payload }) => {
  // },

  presets,
  actions: {
    trackEvent,
    pageEvent,
    screenEvent
  }
}

export default destination
