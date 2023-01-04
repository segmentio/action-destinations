import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
// import { trackApiEndpoint } from '../utils'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'Track a custom event.',
  fields: {
    source_id: {
      label: 'Voucherify Customer ID',
      description:
        'The ID necessary to [create or update customer](https://docs.voucherify.io/reference/the-customer-object) and [create custom event](https://docs.voucherify.io/reference/create-custom-event) in Voucherify.',
      type: 'string',
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.userId' },
          then: { '@path': '$.userId' },
          else: { '@path': '$.email' }
        }
      }
    },

    event: {
      label: 'Event Name',
      description: 'The name of the [custom event](https://docs.voucherify.io/reference/the-custom-event-object).',
      type: 'string',
      required: true,
      default: {
        '@path': '$.event'
      }
    },
    metadata: {
      label: 'Track Event Metadata',
      description: 'Additional data to include with the event.',
      type: 'object',
      default: {
        '@path': '$.properties'
      }
    },
    type: {
      label: 'Event Type',
      description: 'Type of event',
      type: 'string',
      required: true,
      default: {
        '@path': '$.type'
      }
    }
  },

  perform: (request, { payload }) => {
    // const url = `${trackApiEndpoint(settings.apiEndpoint)}/v1/events`
    const url = 'http://localhost:3005/segmentio/event-processing'

    return request(url, {
      method: 'post',
      json: payload
    })
  }
}

export default action
