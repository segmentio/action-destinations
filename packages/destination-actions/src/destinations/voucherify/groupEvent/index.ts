import { ActionDefinition } from '@segment/actions-core'
import { Settings } from '../generated-types'
import { Payload } from './generated-types'
import { setVoucherifyRequestURL } from '../url-provider'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Group Event',
  description: 'Assign individual traits to user, such as company, organization and much more.',
  defaultSubscription: 'type = "group"',
  fields: {
    group_id: {
      label: 'Group ID',
      description: 'The ID used to uniquely identify a customer group.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.groupId'
      }
    },
    source_id: {
      label: 'Customer ID',
      description:
        'The ID necessary to [create or update customer](https://docs.voucherify.io/reference/the-customer-object) in Voucherify.',
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
    traits: {
      label: 'Group metadata',
      description:
        'The group metadata for each customer. [Learn more](https://www.voucherify.io/glossary/metadata-custom-attributes).',
      type: 'object',
      default: {
        '@path': '$.traits'
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
    },
    email: {
      label: 'Email Address',
      description: "The person's email address.",
      type: 'string',
      default: {
        '@path': '$.email'
      }
    }
  },
  perform: (request, { settings, payload }) => {
    const voucherifyRequestURL = setVoucherifyRequestURL(settings, 'group')
    return request(voucherifyRequestURL, {
      method: 'post',
      json: payload
    })
  }
}

export default action
