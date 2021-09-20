import dayjs from '../../../lib/dayjs'
import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { trackApiEndpoint } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Create or Update Person',
  description: "Update a person in Customer.io or create them if they don't exist.",
  defaultSubscription: 'type = "identify"',
  fields: {
    id: {
      label: 'Person ID',
      description: 'ID used to uniquely identify person in Customer.io.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.userId'
      }
    },
    anonymous_id: {
      label: 'Anonymous ID',
      description: 'Anonymous ID to uniquely identify person in Customer.io.',
      type: 'string',
      default: {
        '@path': '$.anonymousId'
      }
    },
    email: {
      label: 'Email Address',
      description: "Person's email address.",
      type: 'string',
      required: true,
      default: {
        '@template': '{{traits.userId}}'
      }
    },
    created_at: {
      label: 'Created At',
      description: 'Timestamp for when the person was created. Default is current date and time.',
      type: 'string',
      default: {
        '@path': '$.timestamp'
      }
    },
    custom_attributes: {
      label: 'Custom Attributes',
      description:
        'Optional custom attributes for this person. When updating a person, attributes are added and not removed.',
      type: 'object',
      default: {
        '@path': '$.traits'
      }
    },
    convert_timestamp: {
      label: 'Convert timestamps',
      description: 'Convert `created_at` to a Unix timestamp (seconds since Epoch).',
      type: 'boolean',
      default: true
    }
  },

  perform: (request, { settings, payload }) => {
    let createdAt: string | number | undefined = payload.created_at

    if (createdAt && payload.convert_timestamp !== false) {
      createdAt = dayjs.utc(createdAt).unix()
    }

    return request(`${trackApiEndpoint(settings.accountRegionEndpoint)}/api/v1/customers/${payload.id}`, {
      method: 'put',
      json: {
        ...payload.custom_attributes,
        email: payload.email,
        created_at: createdAt,
        anonymous_id: payload.anonymous_id
      }
    })
  }
}

export default action
