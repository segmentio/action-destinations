import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

import send from './send'
import { InvalidAuthenticationError } from '@segment/actions-core'

const destination: DestinationDefinition<Settings> = {
  name: 'Aggregations Io',
  slug: 'actions-aggregations-io',
  mode: 'cloud',
  authentication: {
    scheme: 'custom',
    fields: {
      api_key: {
        label: 'API Key',
        description: 'Your Aggregations.io API Key. This key requires Write permissions.',
        type: 'password',
        required: true
      },
      ingest_id: {
        label: 'Ingest Id',
        description:
          'The ID of the ingest you want to send data to. This ingest should be set up as "Array of JSON Objects". Find your ID on the Aggregations.io Organization page.',
        type: 'string',
        required: true
      }
    },

    testAuthentication: async (request, settings) => {
      const resp = await request(
        `https://app.aggregations.io/api/v1/organization/ping-w?ingest_id=${settings.settings.ingest_id}&schema=ARRAY_OF_EVENTS`,
        {
          method: 'get',
          throwHttpErrors: false,
          headers: {
            'x-api-token': settings.settings.api_key
          }
        }
      )
      if (resp.status === 200) {
        return resp
      } else {
        const err_msg = await resp.json()
        throw new InvalidAuthenticationError(err_msg.message || 'Error Validating Credentials')
      }
    }
  },

  extendRequest: ({ settings }) => {
    return {
      headers: { 'x-api-token': settings.api_key }
    }
  },

  actions: {
    send
  }
}

export default destination
