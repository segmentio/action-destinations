import dayjs from '../../../lib/dayjs'
import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

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
    }
  },

  perform: (request, { payload }) => {
    return request(`https://track.customer.io/api/v1/customers/${payload.id}`, {
      method: 'put',
      json: {
        ...payload.custom_attributes,
        email: payload.email,
        created_at: payload.created_at ? dayjs.utc(payload.created_at).format('X') : undefined
      }
    })
  }
}

export default action
