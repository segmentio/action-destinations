import { ActionDefinition, PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { event_type, message_id, timestamp, sent_at, user_id, anonymous_id } from '../common_fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Contact',
  description: 'Send a Contact to ChartMogul CRM',
  defaultSubscription: 'type = "identify"',
  fields: {
    type: { ...event_type, default: 'Send Contact' },
    message_id,
    timestamp,
    sent_at,
    user_id,
    anonymous_id,
    email: {
      label: 'Email',
      description: "The user's email",
      type: 'string',
      format: 'email',
      default: { '@path': '$.traits.email' }
    },
    first_name: {
      label: 'First Name',
      description: `The contact's first name`,
      type: 'string',
      default: { '@path': '$.traits.firstName' }
    },
    last_name: {
      label: 'Last Name',
      description: "The contact's last name",
      type: 'string',
      default: { '@path': '$.traits.lastName' }
    },
    name: {
      label: 'Full Name',
      description: "The contact's full name. It is used if first_name and last_name are not provided.",
      type: 'string',
      default: { '@path': '$.traits.name' }
    },
    title: {
      label: 'Title',
      description: `The contact's job or personal title`,
      type: 'string',
      default: { '@path': '$.traits.title' }
    },
    phone: {
      label: 'Phone Number',
      description: "The contact's phone number",
      type: 'string',
      default: { '@path': '$.traits.phone' }
    },
    linked_in: {
      label: 'LinkedIn',
      description: "The contact's LinkedIn URL",
      type: 'string',
      default: { '@path': '$.traits.linkedIn' }
    },
    twitter: {
      label: 'Twitter (X)',
      description: "The contact's Twitter (X) URL or handle",
      type: 'string',
      default: { '@path': '$.traits.twitter' }
    },
    company: {
      label: 'Company',
      description: "The contact's Company. It creates a Customer in ChartMogul if the company id is present.",
      type: 'object',
      properties: {
        id: {
          label: 'Company Id',
          type: 'string'
        },
        name: {
          label: 'Company Name',
          type: 'string'
        }
      },
      default: {
        id: { '@path': '$.traits.company.id' },
        name: { '@path': '$.traits.company.name' }
      }
    }
  },
  perform: (request, data) => {
    if (!data.payload.user_id && !data.payload.anonymous_id) {
      throw new PayloadValidationError(`The user_id and/or anonymous_id must be present.`)
    }

    if (data.payload.company && !data.payload.company.id) {
      delete data.payload.company
    }

    // we definitely map type, message_id, timestamp, sent_at, and (user_id or anonymous_id)
    // A mapping containing only these fields is not useful.
    if (Object.keys(data.payload).length <= 5) {
      throw new PayloadValidationError('The event contains no information of interest to Chartmogul.')
    }

    return request(data.settings.chartmogul_webhook_url, {
      method: 'post',
      json: data.payload
    })
  }
}

export default action
