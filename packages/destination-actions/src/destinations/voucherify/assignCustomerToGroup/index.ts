import { ActionDefinition } from '@segment/actions-core'
import { Settings } from '../generated-types'
import { Payload } from './generated-types'
import { getVoucherifyEndpointURL } from '../url-provider'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Assign customer to group',
  description: 'Assign a specific group and its traits to the customer.',
  defaultSubscription: 'type = "group"',
  fields: {
    customer: {
      label: 'Customer Object',
      required: true,
      description:
        'Object containing information about the [customer](https://docs.voucherify.io/reference/the-customer-object).',
      type: 'object',
      properties: {
        source_id: {
          label: 'Source ID',
          type: 'string',
          required: true,
          description:
            'The `source_id` which identifies the [customer](https://docs.voucherify.io/reference/the-customer-object) in Voucherify.'
        },
        email: {
          label: 'Email',
          type: 'string',
          description:
            'The email that identifies the [customer](https://docs.voucherify.io/reference/the-customer-object) in Voucherify.'
        }
      },
      default: {
        source_id: { '@path': '$.userId' },
        email: { '@path': '$.email' }
      }
    },
    group_id: {
      label: 'Group ID',
      description:
        'The ID used to uniquely identify a group to which [customer](https://docs.voucherify.io/reference/the-customer-object) belongs.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.groupId'
      }
    },

    traits: {
      label: 'Group Traits',
      description:
        'Traits of the group that will be created in customer [metadata](https://www.voucherify.io/glossary/metadata-custom-attributes).',
      type: 'object',
      default: {
        '@path': '$.traits'
      }
    },
    type: {
      label: 'Event Type',
      description:
        'Type of the [event](https://segment.com/docs/connections/spec/). For example: identify, track, page, screen or group.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.type'
      }
    }
  },
  perform: (request, { settings, payload }) => {
    const voucherifyRequestURL = getVoucherifyEndpointURL(settings, 'group')
    return request(voucherifyRequestURL, {
      method: 'post',
      json: payload
    })
  }
}

export default action
