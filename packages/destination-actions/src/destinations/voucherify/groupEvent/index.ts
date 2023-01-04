import { ActionDefinition } from '@segment/actions-core'
import { Settings } from '../generated-types'
import { Payload } from './generated-types'
import { trackApiEndpoint } from '../utils'

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
        'The ID necessary to [create or update customer](https://docs.voucherify.io/reference/the-customer-object) and [create custom event](https://docs.voucherify.io/reference/create-custom-event) in Voucherify.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.userId'
      }
    },
    traits: {
      label: 'Custom group metadata',
      description:
        'Custom group metadata for each customer. [Learn more](https://www.voucherify.io/glossary/metadata-custom-attributes).',
      type: 'object',
      default: {
        '@path': '$.traits'
      }
    }
  },
  perform: (request, { settings, payload }) => {
    const url = `${trackApiEndpoint(settings.apiEndpoint)}/segmentio/group-processing`

    return request(url, {
      method: 'post',
      json: payload
    })
  }
}

export default action
