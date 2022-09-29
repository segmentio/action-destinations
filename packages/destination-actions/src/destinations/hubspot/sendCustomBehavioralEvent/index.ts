import type { ActionDefinition } from '@segment/actions-core'
import transform from 'lodash/transform'
import type { Settings } from '../generated-types'
import { HubSpotBaseURL } from '../properties'
import type { Payload } from './generated-types'

type CustomBehvioralEvent = {
  eventName: string
  occurredAt?: string | number
  properties?: { [k: string]: unknown }
  utk?: string
  email?: string
  objectId?: string
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Custom Behavioral Event',
  description: 'Send a custom behavioral event to HubSpot.',
  defaultSubscription: 'type = "track"',
  fields: {
    eventName: {
      label: 'Event Name',
      description:
        'The internal event name assigned by HubSpot. This can be found in your HubSpot account. Events must be predefined in HubSpot. Learn how to find the internal name in [HubSpot’s documentation](https://knowledge.hubspot.com/analytics-tools/create-custom-behavioral-events?_ga=2.219778269.578939721.1663963266-497800475.1660075188#define-the-api-call).',
      type: 'string',
      required: true
    },
    occurredAt: {
      label: 'Event Timestamp',
      description: "The time when this event occurred. If this isn't set, the current time will be used.",
      type: 'datetime',
      default: {
        '@path': '$.timestamp'
      }
    },
    email: {
      label: 'Email Address',
      description:
        'The email of the contact associated with this event. This is required if no user token or object ID is provided.',
      type: 'string',
      format: 'email',
      default: {
        '@if': {
          exists: { '@path': '$.properties.email' },
          then: { '@path': '$.properties.email' },
          else: { '@path': '$.context.traits.email' }
        }
      }
    },
    utk: {
      label: 'User Token',
      description:
        'The user token (utk) of the contact associated with this event. This is required if no email or object ID is provided.',
      type: 'string'
    },
    objectId: {
      label: 'Object ID',
      description:
        'The ID of the object associated with this event. This can be the HubSpot contact ID, company ID, or ID of any other object. This is required if no email or user token is provided.',
      type: 'string'
    },
    properties: {
      label: 'Event Properties',
      description:
        'Default or custom properties that describe the event. See more information in [HubSpot’s documentation](https://knowledge.hubspot.com/analytics-tools/create-custom-behavioral-events#add-and-manage-event-properties).',
      type: 'object',
      defaultObjectUI: 'keyvalue:only'
    }
  },
  perform: (request, { payload }) => {
    const eventProperties = payload.properties ? santizePropertyKeys(payload.properties) : {}

    const event: CustomBehvioralEvent = {
      eventName: payload.eventName,
      occurredAt: payload.occurredAt,
      utk: payload.utk,
      email: payload.email,
      objectId: payload.objectId,
      properties: eventProperties
    }
    return request(`${HubSpotBaseURL}/events/v3/send`, {
      method: 'post',
      json: event
    })
  }
}

// Converts property names to Lowercases as HubSpot accepts only lowercased names.
function santizePropertyKeys(properties: { [k: string]: unknown }) {
  return transform(properties, (result: Record<string, unknown>, value, key) => {
    // HubSpot only accepts strings and numbers as values. Refer - https://developers.hubspot.com/docs/api/analytics/events
    // this check is to skip properties of type object although that is unlikely since
    // properties is of type keyvalue:only.
    // For dates, both ISO 8601 and Unix timestamp formats are supported - https://developers.hubspot.com/docs/api/faq
    if (typeof value != 'object') result[key.toLowerCase()] = value
  })
}

export default action
