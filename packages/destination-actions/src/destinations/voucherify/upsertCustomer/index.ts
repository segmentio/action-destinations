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
        'The `source_id` which identifies the [customer](https://docs.voucherify.io/reference/the-customer-object) in Voucherify.',
      type: 'string',
      required: true,
      default: { '@path': '$.userId' }
    },
    name: {
      label: 'Name',
      allowNull: true,
      description: 'First name and last name of the [customer](https://docs.voucherify.io/reference/customer-object).',
      type: 'string',
      default: {
        '@path': '$.traits.name'
      }
    },
    first_name: {
      label: 'First Name',
      allowNull: true,
      description:
        'First name of the [customer](https://docs.voucherify.io/reference/customer-object). It will be merged with `last_name` to create the `name` field.',
      type: 'string',
      default: {
        '@path': '$.traits.first_name'
      }
    },
    last_name: {
      label: 'Last Name',
      allowNull: true,
      description:
        'Last name of the [customer](https://docs.voucherify.io/reference/customer-object). It will be merged with `first_name` to create the `name` field.',
      type: 'string',
      default: {
        '@path': '$.traits.last_name'
      }
    },
    description: {
      label: 'Description',
      allowNull: true,
      description:
        'An arbitrary string that you can attach to a [customer](https://docs.voucherify.io/reference/customer-object) object.',
      type: 'string',
      default: {
        '@path': '$.traits.description'
      }
    },
    email: {
      label: 'Email Address',
      allowNull: true,
      description:
        'The email that identifies the [customer](https://docs.voucherify.io/reference/the-customer-object) in Voucherify.',
      type: 'string',
      default: {
        '@path': '$.traits.email'
      }
    },
    phone: {
      label: 'Phone',
      allowNull: true,
      description: 'Phone number of the [customer](https://docs.voucherify.io/reference/the-customer-object).',
      type: 'string',
      default: {
        '@path': '$.traits.phone'
      }
    },
    birthdate: {
      label: 'Birthdate',
      allowNull: true,
      description:
        'Birthdate of the [customer](https://docs.voucherify.io/reference/the-customer-object). You can pass data here in `date` or `datetime` format (ISO 8601).',
      type: 'string',
      default: {
        '@path': '$.traits.birthdate'
      }
    },
    address: {
      label: 'Address',
      description: 'Address of the [customer](https://docs.voucherify.io/reference/the-customer-object).',
      type: 'object',
      properties: {
        city: {
          label: 'City',
          type: 'string',
          allowNull: true
        },
        state: {
          label: 'State',
          type: 'string',
          allowNull: true
        },
        postal_code: {
          label: 'Postal Code',
          type: 'string',
          allowNull: true
        },
        street: {
          label: 'Street',
          type: 'string',
          allowNull: true
        },
        country: {
          label: 'Country',
          type: 'string',
          allowNull: true
        }
      },
      default: {
        city: { '@path': '$.traits.address.city' },
        state: { '@path': '$.traits.address.state' },
        postal_code: { '@path': '$.traits.address.postal_code' },
        street: { '@path': '$.traits.address.street' },
        country: { '@path': '$.traits.address.country' }
      }
    },
    metadata: {
      label: 'Metadata',
      description:
        'A set of custom key/value pairs that you can attach to a customer. The metadata object stores all custom attributes assigned to the customer. It can be useful for storing additional information about the customer in a structured format.',
      type: 'object',
      allowNull: true,
      default: {
        '@path': '$.traits.metadata'
      }
    },
    type: {
      label: 'Event Type',
      description:
        'Type of the [event](https://segment.com/docs/connections/spec/). For example: identify, track, page, screen or group',
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
