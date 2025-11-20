import { DestinationDefinition, defaultValues } from '@segment/actions-core'
import { Settings } from './generated-types'
import identifyUser from './identifyUser'
import trackEvent from './trackEvent'
import identifyGroup from './identifyGroup'

const presets: DestinationDefinition['presets'] = [
  {
    name: 'Track Events',
    subscribe: 'type = "track"',
    partnerAction: 'trackEvent',
    mapping: { ...defaultValues(trackEvent.fields) },
    type: 'automatic'
  },
  {
    name: 'Identify Calls',
    subscribe: 'type = "identify"',
    partnerAction: 'identifyUser',
    mapping: { ...defaultValues(identifyUser.fields) },
    type: 'automatic'
  },
  {
    name: 'Group Calls',
    subscribe: 'type = "group"',
    partnerAction: 'identifyGroup',
    mapping: { ...defaultValues(identifyGroup.fields) },
    type: 'automatic'
  }
]

const destination: DestinationDefinition<Settings> = {
  name: 'Survicate Cloud Mode (Actions)',
  slug: 'actions-survicate-cloud',
  mode: 'cloud',
  description: 'Sync Segment analytics events, user profile and company profile details to Survicate.',
  authentication: {
    scheme: 'custom',
    fields: {
      apiKey: {
        label: 'API Key',
        description: 'Your Survicate API key',
        type: 'string',
        required: true
      }
    },
    testAuthentication: async (request, { settings }) => {
      return request(`https://integrations.survicate.com/endpoint/segment/check`, {
        method: 'get',
        headers: {
          Authorization: `Bearer ${settings.apiKey}`,
          'Content-Type': 'application/json'
        }
      })
    }
  },
  extendRequest({ settings }) {
    return {
      headers: {
        Authorization: `Bearer ${settings.apiKey}`,
        'Content-Type': 'application/json'
      }
    }
  },

  presets,
  actions: {
    trackEvent,
    identifyUser,
    identifyGroup
  }
}

export default destination
