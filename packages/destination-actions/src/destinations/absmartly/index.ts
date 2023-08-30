import type { DestinationDefinition, Preset, RequestClient } from '@segment/actions-core'
import type { Settings } from './generated-types'

import trackGoal from './trackGoal'
import trackExposure from './trackExposure'
import { defaultValues, InputField } from '@segment/actions-core'

function patch(field: InputField, patch: Partial<InputField>): InputField {
  return {
    ...field,
    ...patch
  }
}

const presets: Preset[] = [
  {
    name: 'Track Calls',
    subscribe: 'type = "track" and event != "Experiment Viewed"',
    partnerAction: 'trackGoal',
    mapping: defaultValues(trackGoal.fields),
    type: 'automatic'
  },
  {
    name: 'Page Calls',
    subscribe: 'type = "page"',
    partnerAction: 'trackGoal',
    mapping: defaultValues({
      ...trackGoal.fields,
      name: patch(trackGoal.fields.name, { default: { '@template': 'Page: {{ name }}' } })
    }),
    type: 'automatic'
  },
  {
    name: 'Screen Calls',
    subscribe: 'type = "screen"',
    partnerAction: 'trackGoal',
    mapping: defaultValues({
      ...trackGoal.fields,
      name: patch(trackGoal.fields.name, { default: { '@template': 'Screen: {{ name }}' } })
    }),
    type: 'automatic'
  },
  {
    name: 'Exposures (Verbatim)',
    subscribe: 'type = "track" and event = "Experiment Viewed"',
    partnerAction: 'trackExposure',
    mapping: defaultValues(trackExposure.fields),
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
    trackGoal,
    trackExposure
  }
}

export default destination
