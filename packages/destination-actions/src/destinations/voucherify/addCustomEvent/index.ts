import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { getVoucherifyEndpointURL } from '../url-provider'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Add custom event',
  description:
    'Send the Track, Page or Screen event that will be saved as a [custom event](https://docs.voucherify.io/reference/the-custom-event-object) in Voucherify.',
  defaultSubscription: 'type = "track" or type = "page" or type = "screen"',
  fields: {
    source_id: {
      label: 'Source ID',
      description:
        'The source_id which identifies the [customer](https://docs.voucherify.io/reference/the-customer-object) in Voucherify.',
      type: 'string',
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.userId' },
          then: { '@path': '$.userId' },
          else: { '@path': '$.anonymousId' }
        }
      }
    },
    email: {
      label: 'Email Address',
      description:
        'The email that identifies the [customer](https://docs.voucherify.io/reference/the-customer-object) in Voucherify.',
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.properties.email' },
          then: { '@path': '$.properties.email' },
          else: { '@path': '$.context.traits' }
        }
      }
    },
    event: {
      label: 'Event Name',
      description:
        'The name of the event that will be saved as a [custom event](https://docs.voucherify.io/reference/the-custom-event-object) in Voucherify.',
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.event' },
          then: { '@path': '$.event' },
          else: { '@path': '$.name' }
        }
      }
    },
    metadata: {
      label: 'Track Event Metadata',
      description:
        'Additional data that will be stored in the [custom event](https://docs.voucherify.io/reference/the-custom-event-object) metadata in Voucherify.',
      type: 'object',
      default: {
        '@path': '$.properties'
      }
    },
    type: {
      label: 'Event Type',
      description: 'Type of the event. It can be track, page or screen.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.type'
      }
    }
  },

  perform: (request, { settings, payload }) => {
    const voucherifyRequestURL = getVoucherifyEndpointURL(settings, 'event')
    return request(voucherifyRequestURL, {
      method: 'post',
      json: payload
    })
  }
}

export default action
