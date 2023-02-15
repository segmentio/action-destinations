import { ActionDefinition } from '@segment/actions-core'
import { Settings } from '../generated-types'
import { Payload } from './generated-types'
import { getVoucherifyEndpointURL } from '../url-provider'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Assign customer to group',
  description: 'Assign a specific group and its traits to the customer.',
  defaultSubscription: 'type = "group"',
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
        '@path': '$.email'
      }
    },
    group_id: {
      label: 'Group ID',
      description: 'The ID used to uniquely identify a group to which customer belongs.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.groupId'
      }
    },

    traits: {
      label: 'Group traits',
      description:
        'Traits of the group that will be created in customer [metadata](https://www.voucherify.io/glossary/metadata-custom-attributes).',
      type: 'object',
      default: {
        '@path': '$.traits'
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
    const voucherifyRequestURL = getVoucherifyEndpointURL(settings, 'group')
    return request(voucherifyRequestURL, {
      method: 'post',
      json: payload
    })
  }
}

export default action
