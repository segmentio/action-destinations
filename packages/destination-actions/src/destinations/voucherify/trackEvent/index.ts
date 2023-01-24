import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { getVoucherifyEndpointURL } from '../url-provider'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description:
    'Send the [track event](https://segment.com/docs/connections/spec/track/) that will be saved as a [custom event](https://docs.voucherify.io/reference/the-custom-event-object) in Voucherify.',
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

    event: {
      label: 'Event Name',
      description:
        'The name of the track event that will be saved as a [custom event](https://docs.voucherify.io/reference/the-custom-event-object) in Voucherify.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.event'
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
      description: 'Type of the event [The Segment Spec](https://segment.com/docs/connections/spec/).',
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
