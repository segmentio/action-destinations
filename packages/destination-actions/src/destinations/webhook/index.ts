import type {AudienceResult, CreateAudienceInput, DestinationDefinition} from '@segment/actions-core'
import type { Settings } from './generated-types'
import { createHmac } from 'crypto'

import send from './send'
import {IntegrationError} from "@segment/actions-core";

const destination: DestinationDefinition<Settings> = {
  name: 'Webhook',
  slug: 'actions-webhook',
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
        audienceOnly: true,
        description: 'If set, Segment will send a request to the provided URL to create the audience.'
      },
      getAudienceUrl: {
        type: 'string',
        label: 'URL to send requests to get an audience',
        audienceOnly: true,
        description: 'If set, Segment will send a request to the provided URL to get the audience.'
      }
    }
  },
  audienceSettings: {
    async createAudience(request, createAudienceInput): Promise<AudienceResult> {
      const audienceName = createAudienceInput.audienceName;
      if (audienceName?.length == 0) {
        throw new IntegrationError('Missing audience name value', 'MISSING_REQUIRED_FIELD', 400)
      }

      const createAudienceUrl = createAudienceInput.settings.createAudienceUrl;
      if (!createAudienceUrl) {
        throw new IntegrationError('Missing audience url value', 'MISSING_REQUIRED_FIELD', 400)
      }

      const response = await request(createAudienceUrl, {
        method: "POST",
        json: {
          audienceName
        }
      })

      const jsonOutput = await response.json()
      if (!jsonOutput['externalId']) {
        // TODO: what's a good error code here?
        throw new IntegrationError('Invalid response from create audience URL', 'MISSING_REQUIRED_FIELD', 400)
      }

      return jsonOutput
    }
  },
  extendRequest: ({ settings, payload }) => {
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
