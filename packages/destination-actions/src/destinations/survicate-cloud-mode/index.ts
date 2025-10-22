import { IntegrationError, DestinationDefinition } from '@segment/actions-core'
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

  onDelete: async (request, { settings, payload }) => {
    const { userId, anonymousId } = payload

    if (!userId && !anonymousId) {
      throw new IntegrationError(
        'Either userId or anonymousId must be provided for GDPR deletion',
        'Missing required field',
        400
      )
    }

    return request(`https://integrations.survicate.com/endpoint/segment/gdpr-delete-request`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${settings.apiKey}`,
        'Content-Type': 'application/json'
      },
      json: {
        ...(userId && { userId }),
        ...(anonymousId && { anonymousId }),
        timestamp: new Date().toISOString()
      }
    })
  },

  actions: {
    identifyUser,
    trackEvent,
    identifyGroup
  }
}

export default destination
