import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { PayloadValidationError, RequestClient } from '@segment/actions-core'
import { API_URL } from '../config'
import { EventData } from '../types'

const createEventData = (payload: Payload) => ({
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
            name: 'Order Completed'
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
})

const sendProductRequests = async (payload: Payload, eventData: EventData, request: RequestClient) => {
  if (payload.products && Array.isArray(payload.products)) {
    const productPromises = payload?.products?.map((product) => {
      eventData.data.attributes.properties = product.properties
      eventData.data.attributes.value = product.value
      eventData.data.attributes.metric.data.attributes.name = 'Ordered Product'

      return request(`${API_URL}/events/`, {
        method: 'POST',
        json: eventData
      })
    })

    await Promise.all(productPromises)
  }
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Order Completed',
  description: 'Order Completed Event action tracks users Order Completed events and associate it with their profile.',
  defaultSubscription: 'type = "track"',
  fields: {
    profile: {
      label: 'Profile',
      description: `Properties of the profile that triggered this event.`,
      type: 'object',
      properties: {
        email: {
          label: 'Email',
          type: 'string'
        },
        phone_number: {
          label: 'Phone Number',
          type: 'string'
        },
        other_properties: {
          label: 'Other Properties',
          type: 'object'
        }
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
        '@path': '$.messageId'
      }
    },
    products: {
      label: 'Products',
      description: 'List of products purchased in the order.',
      multiple: true,
      type: 'object',
      properties: {
        value: {
          label: 'Value',
          description: 'A numeric value to associate with this event. For example, the dollar amount of a purchase.',
          type: 'number'
        },
        properties: {
          description: `Properties of this event.`,
          label: 'Properties',
          type: 'object'
        }
      }
    }
  },

  perform: async (request, { payload }) => {
    const { email, phone_number } = payload.profile

    if (!email && !phone_number) {
      throw new PayloadValidationError('One of Phone Number or Email is required.')
    }

    const eventData = createEventData(payload)

    const event = await request(`${API_URL}/events/`, {
      method: 'POST',
      json: eventData
    })

    if (event.status == 202 && Array.isArray(payload.products)) {
      await sendProductRequests(payload, eventData, request)
    }
    return event
  }
}

export default action
