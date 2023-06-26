import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import send from '../webhook/send'
import { IntegrationError } from '@segment/actions-core'
import { createHmac } from 'crypto'

const externalIdKey = 'externalId'
const audienceNameKey = 'audienceName'

const destination: DestinationDefinition<Settings> = {
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
  audienceSettings: {
    mode: {
      type: 'synced',
      full_audience_sync: false
    },
    async getAudience(request, getAudienceInput) {
      const getAudienceUrl = getAudienceInput.settings.getAudienceUrl
      if (!getAudienceUrl) {
        throw new IntegrationError('Missing get audience url value', 'MISSING_REQUIRED_FIELD', 400)
      }

      const response = await request(getAudienceUrl, {
        method: 'POST',
        json: {
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

      const response = await request(createAudienceUrl, {
        method: 'POST',
        json: {
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
    send
  }
}

export default destination
