import { DestinationDefinition } from '@segment/actions-core'
import { Settings } from './generated-types'
import identifyUser from './identifyUser'
import trackEvent from './trackEvent'
import identifyGroup from './identifyGroup'

const destination: DestinationDefinition<Settings> = {
  name: 'Survicate Cloud Mode (Actions)',
  slug: 'actions-survicate-cloud',
  mode: 'cloud',

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

  actions: {
    identifyUser,
    trackEvent,
    identifyGroup
  }
}

export default destination
