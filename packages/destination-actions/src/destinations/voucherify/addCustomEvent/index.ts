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
    customer: {
      label: 'customer',
      required: true,
      description:
        'This is an object containing information about the [customer](https://docs.voucherify.io/reference/the-customer-object).',
      type: 'object',
      properties: {
        source_id: {
          label: 'Source Id',
          type: 'string',
          required: true
        },
        email: {
          label: 'Email',
          type: 'string'
        }
      },
      default: {
        source_id: { '@path': '$.userId' },
        email: {
          '@if': {
            exists: { '@path': '$.properties.email' },
            then: { '@path': '$.properties.email' },
            else: { '@path': '$.context.traits' }
          }
        }
      }
    },
    referral: {
      label: 'referral',
      description:
        'If a conversion event for a referral program is set to a [custom event](https://docs.voucherify.io/reference/custom-event-object), then you need to send the referral code in the payload to make a record of the conversion event.',
      type: 'object',
      properties: {
        code: {
          label: 'code',
          type: 'string'
        },
        referrer_id: {
          label: 'referrer_id',
          type: 'string'
        }
      },
      default: {
        code: { '@path': '$.properties.referral.code' },
        referrer_id: { '@path': '$.properties.referral.referrer_id' }
      }
    },
    loyalty: {
      label: 'loyalty',
      description:
        'If an earning rule in a loyalty program is based on a [custom event](https://docs.voucherify.io/reference/custom-event-object). This objects allows you specify the loyalty card to which the custom event should be attributed to.',
      type: 'object',
      properties: {
        code: {
          label: 'code',
          type: 'string'
        }
      },
      default: {
        code: { '@path': '$.properties.loyalty.code' }
      }
    },
    metadata: {
      label: 'Track Event Metadata',
      description:
        'The metadata object stores all custom attributes assigned to the [custom event](https://docs.voucherify.io/reference/custom-event-object). A set of key/value pairs that you can attach to an event object. It can be useful for storing additional information about the event in a structured format. Event metadata schema is defined in the Dashboard > Project Settings > Event Schema > Edit particular event > Metadata property definition.',
      type: 'object',
      default: {
        '@path': '$.properties.metadata'
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
    type: {
      label: 'Event Type',
      description: 'Type of the [event](https://segment.com/docs/connections/spec/). It can be Track, Page or Screen.',
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
