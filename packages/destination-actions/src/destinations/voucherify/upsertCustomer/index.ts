import { ActionDefinition } from '@segment/actions-core'
import { Settings } from '../generated-types'
import { getVoucherifyEndpointURL } from '../url-provider'
import { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: ' Upsert Customer',
  description:
    'Send the [identify event](https://segment.com/docs/connections/spec/identify/) to create or update the [customer](https://docs.voucherify.io/reference/the-customer-object)',
  defaultSubscription: 'type = "identify"',
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
        '@path': '$.traits.email'
      }
    },
    traits: {
      label: 'Customer Attributes',
      description:
        'Additional [customer](https://docs.voucherify.io/reference/the-customer-object) attributes, such as email, name, description, phone, address, birthdate, metadata. When updating a customer, attributes are either added or updated in the customer object.',
      additionalProperties: true,
      defaultObjectUI: 'keyvalue',
      type: 'object',
      properties: {
        firstName: {
          label: 'First Name',
          type: 'string'
        },
        lastName: {
          label: 'Last Name',
          type: 'string'
        },
        name: {
          label: 'Name',
          type: 'string'
        },
        description: {
          label: 'Description',
          type: 'string'
        },
        address: {
          label: 'Address',
          type: 'object'
        },
        phone: {
          label: 'Phone',
          type: 'string'
        },
        birthdate: {
          label: 'Birthdate',
          type: 'string'
        },
        metadata: {
          label: 'Metadata',
          type: 'object'
        }
      },
      default: {
        firstName: { '@path': '$.traits.first_name' },
        lastName: { '@path': '$.traits.last_name' },
        name: { '@path': '$.traits.name' },
        description: { '@path': '$.traits.description' },
        address: { '@path': '$.traits.address' },
        phone: { '@path': '$.traits.phone' },
        birthdate: { '@path': '$.traits.birthdate' },
        metadata: { '@path': '$.traits.metadata' }
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
    const voucherifyRequestURL = getVoucherifyEndpointURL(settings, 'customer')
    return request(voucherifyRequestURL, {
      method: 'post',
      json: payload
    })
  }
}

export default action
