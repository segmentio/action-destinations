import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import { IntegrationError } from '@segment/actions-core'
import { API_URL } from '../config'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'Track user events and associate it with their profile.',
  fields: {
    profile: {
      label: 'Profile',
      description: `Properties of the profile that triggered this event.`,
      type: 'object',
      properties: {
        email: {
          label: 'Email',
          type: 'string',
          allowNull: true
        },
        phone_number: {
          label: 'Phone Number',
          type: 'string',
          allowNull: true
        },
        other_properties: {
          label: 'Other Properties',
          type: 'object',
          allowNull: true
        }
      },
      required: true
    },
    metric_name: {
      label: 'Metric Name',
      description: 'Name of the event. Must be less than 128 characters.',
      type: 'string',
      default: {
        '@path': '$.event'
      },
      required: true
    },
    properties: {
      description: `Properties of this event.`,
      label: 'Properties',
      type: 'object',
      default: {
        '@path': '$.properties'
      },
      required: true
    },
    time: {
      label: 'Time',
      description: `When this event occurred. By default, the time the request was received will be used.
      The time is truncated to the second. The time must be after the year 2000 and can only
      be up to 1 year in the future.
      `,
      type: 'datetime',
      default: {
        '@path': '$.timestamp'
      }
    },
    value: {
      label: 'Value',
      description: 'A numeric value to associate with this event. For example, the dollar amount of a purchase.',
      type: 'number'
    },
    unique_id: {
      label: 'Unique ID',
      description: `A unique identifier for an event. If the unique_id is repeated for the same
      profile and metric, only the first processed event will be recorded. If this is not
      present, this will use the time to the second. Using the default, this limits only one
      event per profile per second.
      `,
      type: 'string',
      default: {
        '@path': '$.event'
      }
    },
    products: {
      label: 'Products',
      description: 'List of products purchased in the order.',
      type: 'object'
    }
  },
  perform: (request, { payload }) => {
    const { email, phone_number } = payload.profile

    if (!email && !phone_number) {
      throw new IntegrationError('One of Phone Number or Email is required.', 'Missing required fields', 400)
    }

    const eventData = {
      data: {
        type: 'event',
        attributes: {
          properties: { ...payload.properties },
          time: payload.time,
          value: payload.value,
          metric: {
            data: {
              type: 'metric',
              attributes: {
                name: payload.metric_name
              }
            }
          },
          profile: {
            data: {
              type: 'profile',
              attributes: {
                ...payload.profile
              }
            }
          }
        }
      }
    }

    return request(`${API_URL}/events/`, {
      method: 'POST',
      json: eventData
    })
  }
}

export default action
