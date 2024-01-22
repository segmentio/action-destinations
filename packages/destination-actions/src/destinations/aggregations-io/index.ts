import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'
import send from './send'

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
    testAuthentication: (request, { settings }) => {
      return request(
        `https://app.aggregations.io/api/v1/organization/ping-w?ingest_id=${settings.ingest_id}&schema=ARRAY_OF_EVENTS`,
        {
          method: 'get',
          throwHttpErrors: false,
          headers: {
            'x-api-token': settings.api_key
          }
        }
      )
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
