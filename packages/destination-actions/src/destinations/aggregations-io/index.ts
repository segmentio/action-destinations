import type { DestinationDefinition } from '@segment/actions-core'
import { InvalidAuthenticationError } from '@segment/actions-core'
import type { Settings } from './generated-types'
import send from './send'
import { AggregationsAuthError } from './types'

const destination: DestinationDefinition<Settings> = {
  name: 'Aggregations.io (Actions)',
  slug: 'actions-aggregations-io',
  mode: 'cloud',
  description: 'Send Segment events to Aggregations.io',
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
    testAuthentication: async (request, { settings }) => {
      try {
        return await request(
          `https://app.aggregations.io/api/v1/organization/ping-w?ingest_id=${settings.ingest_id}&schema=ARRAY_OF_EVENTS`,
          {
            method: 'get',
            headers: {
              'x-api-token': settings.api_key
            }
          }
        )
      } catch (e: any) {
        const error = e as AggregationsAuthError
        if (error.response.data) {
          const { message } = error.response.data
          throw new InvalidAuthenticationError(message)
        }
        throw new InvalidAuthenticationError('Error Validating Credentials')
      }
    }
  },
  extendRequest({ settings }) {
    return {
      headers: { 'x-api-token': settings.api_key }
    }
  },
  actions: {
    send
  }
}
export default destination
