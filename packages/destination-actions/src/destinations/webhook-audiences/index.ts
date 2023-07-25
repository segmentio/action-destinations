import type { AudienceDestinationDefinition } from '@segment/actions-core'
import type { Settings, AudienceSettings } from './generated-types'

import send from '../webhook/send'
import { IntegrationError } from '@segment/actions-core'
import { createHmac } from 'crypto'
const externalIdKey = 'externalId'
const audienceNameKey = 'audienceName'

const destination: AudienceDestinationDefinition<Settings, AudienceSettings> = {
  name: 'Webhook Audiences',
  slug: 'actions-webhook-audiences',
  mode: 'cloud',
  authentication: {
    scheme: 'custom',
    fields: {
      sharedSecret: {
        type: 'string',
        label: 'Shared Secret',
        description:
          'If set, Segment will sign requests with an HMAC in the "X-Signature" request header. The HMAC is a hex-encoded SHA1 hash generated using this shared secret and the request body.'
      },
      createAudienceUrl: {
        type: 'string',
        label: 'URL to send requests to create an audience',
        description: `If set, Segment will send a POST request with the ${audienceNameKey} in the JSON to the provided URL to create the audience. The expected JSON response must have "${externalIdKey}".`
      },
      getAudienceUrl: {
        type: 'string',
        label: 'URL to send requests to get an audience',
        description: `If set, Segment will send a POST request with the ${externalIdKey} in the JSON to the provided URL to get the audience. The expected JSON response must have "${externalIdKey}".`
      }
    }
  },
  audienceFields: {
    extras: {
      type: 'string',
      label: `Extra json fields to pass on to every request.  Note: "${externalIdKey}" and "${audienceNameKey}" are reserved.`,
      description: `Extra json fields to pass on to every request. Note: "${externalIdKey}" and "${audienceNameKey}" are reserved.`
    }
  },
  audienceConfig: {
    mode: {
      type: 'synced',
      full_audience_sync: false
    },
    async getAudience(request, getAudienceInput) {
      const getAudienceUrl = getAudienceInput.settings.getAudienceUrl
      if (!getAudienceUrl) {
        throw new IntegrationError('Missing get audience url value', 'MISSING_REQUIRED_FIELD', 400)
      }

      const extras = parseExtraSettingsJson(getAudienceInput.audienceSettings?.extras)

      const response = await request(getAudienceUrl, {
        method: 'POST',
        json: {
          ...extras,
          [externalIdKey]: getAudienceInput.externalId
        }
      })

      const jsonOutput = await response.json()
      if (!jsonOutput[externalIdKey]) {
        throw new IntegrationError('Invalid response from get audience request', 'INVALID_RESPONSE', 400)
      }

      return {
        externalId: jsonOutput[externalIdKey]
      }
    },
    async createAudience(request, createAudienceInput) {
      const audienceName = createAudienceInput.audienceName
      if (audienceName?.length == 0) {
        throw new IntegrationError('Missing audience name value', 'MISSING_REQUIRED_FIELD', 400)
      }

      const createAudienceUrl = createAudienceInput.settings.createAudienceUrl
      if (!createAudienceUrl) {
        throw new IntegrationError('Missing create audience url value', 'MISSING_REQUIRED_FIELD', 400)
      }

      const extras = parseExtraSettingsJson(createAudienceInput.audienceSettings?.extras)

      const response = await request(createAudienceUrl, {
        method: 'POST',
        json: {
          ...extras,
          audienceName
        }
      })

      const jsonOutput = await response.json()
      if (!jsonOutput[externalIdKey]) {
        throw new IntegrationError('Invalid response from create audience request', 'INVALID_RESPONSE', 400)
      }

      return {
        externalId: jsonOutput[externalIdKey]
      }
    }
  },
  extendRequest: ({ settings, payload }) => {
    if (!payload) {
      return {}
    }

    const payloadData = payload.length ? payload[0]['data'] : payload['data']
    if (settings.sharedSecret && payloadData) {
      const digest = createHmac('sha1', settings.sharedSecret).update(JSON.stringify(payloadData), 'utf8').digest('hex')
      return { headers: { 'X-Signature': digest } }
    }
    return {}
  },
  actions: {
    send: {
      ...send,
      perform: (request, { payload, settings, audienceSettings }) => {
        const extras = parseExtraSettingsJson(audienceSettings?.extras)
        // Call the same perform function from the regular webhook destination
        // and add in our extraSettings
        return send.perform(request, {
          audienceSettings,
          payload: {
            ...payload,
            data: {
              ...payload.data,
              ...extras
            }
          },
          settings
        })
      },
      performBatch: (request, { payload, settings, audienceSettings }) => {
        const extras = parseExtraSettingsJson(audienceSettings?.extras)

        // Call the same performBatch function from the regular webhook destination
        // and add in our extraSettings
        return send.performBatch!(request, {
          audienceSettings,
          payload: payload.map((p) => {
            return {
              ...p,
              data: {
                ...p.data,
                ...extras
              }
            }
          }),
          settings
        })
      }
    }
  }
}

const parseExtraSettingsJson = (extraSettingsJson?: string): object => {
  let extraSettings = {}
  if (extraSettingsJson) {
    try {
      extraSettings = JSON.parse(extraSettingsJson)
    } catch (e) {
      throw new IntegrationError('Invalid extraSettings JSON', 'INVALID_REQUEST_DATA', 400)
    }
  }
  return extraSettings
}

export default destination
