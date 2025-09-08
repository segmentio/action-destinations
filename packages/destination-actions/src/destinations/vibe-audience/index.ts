import type { AudienceDestinationDefinition } from '@segment/actions-core'
import { IntegrationError } from '@segment/actions-core'
import type { Settings, AudienceSettings } from './generated-types'
import { advertiserId, authToken } from './vibe-properties'
import sync from './sync'
import { BASE_URL, API_VERSION } from './constants'

const EXTERNAL_ID_KEY = 'id'

const destination: AudienceDestinationDefinition<Settings, AudienceSettings> = {
  name: 'Vibe Audience',
  slug: 'actions-vibe-audience',
  mode: 'cloud',
  description: 'The Vibe Audience destination.',

  authentication: {
    scheme: 'custom',
    fields: {
      advertiserId: advertiserId,
      authToken: authToken
    },
    testAuthentication: async (request, { settings }) => {
      return request(`${BASE_URL}/${API_VERSION}/webhooks/twilio/${settings.advertiserId}`, {
        method: 'GET',
        headers: { 'x-api-key': settings.authToken }
      })
    }
  },

  audienceFields: {
    audienceDescription: {
      type: 'string',
      label: 'Description',
      description: 'A brief description about your audience.',
      required: false
    }
  },

  audienceConfig: {
    mode: {
      type: 'synced',
      full_audience_sync: false
    },
    async createAudience(request, createAudienceInput) {
      const audienceName = createAudienceInput.audienceName

      if (!audienceName) {
        throw new IntegrationError('Missing audience name value', 'MISSING_REQUIRED_FIELD', 400)
      }

      const createAudienceUrl = `${BASE_URL}/${API_VERSION}/webhooks/twilio/${createAudienceInput.settings.advertiserId}/audience`
      const payload = {
        name: audienceName
      }

      let response
      try {
        response = await request(createAudienceUrl, {
          method: 'POST',
          headers: {
            'x-api-key': createAudienceInput.settings.authToken,
            'Content-Type': 'application/json'
          },
          json: payload
        })
      } catch (err) {
        let message = err.response?.content || err.message

        if (typeof message === 'string') {
          try {
            const parsed = JSON.parse(message)
            if (parsed?.error) {
              message = parsed.error.message || parsed.error
            }
          } catch (e) {
            // No-Op
          }
        }

        throw new IntegrationError(String(message), 'CREATE_AUDIENCE_FAILED', 400)
      }

      const r = await response.json()
      if (!r[EXTERNAL_ID_KEY]) {
        throw new IntegrationError('Invalid response from create audience request', 'INVALID_RESPONSE', 400)
      }

      return {
        externalId: r[EXTERNAL_ID_KEY]
      }
    },

    async getAudience(request, getAudienceInput) {
      const getAudienceUrl = `${BASE_URL}/${API_VERSION}/webhooks/twilio/${getAudienceInput.settings.advertiserId}/audiences/${getAudienceInput.externalId}`

      const response = await request(getAudienceUrl, {
        method: 'GET',
        headers: {
          'x-api-key': getAudienceInput.settings.authToken
        }
      })

      const r = await response.json()
      if (!r[EXTERNAL_ID_KEY]) {
        throw new IntegrationError('Invalid response from get audience request', 'INVALID_RESPONSE', 400)
      }

      if (getAudienceInput.externalId !== r[EXTERNAL_ID_KEY]) {
        throw new IntegrationError("Couldn't find audience", 'INVALID_RESPONSE', 400)
      }

      return {
        externalId: r[EXTERNAL_ID_KEY]
      }
    }
  },

  actions: {
    sync
  },

  presets: []
}

export default destination
