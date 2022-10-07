import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
<<<<<<< HEAD
import { HubSpotBaseURL } from '../properties'
import type { Payload } from './generated-types'

interface CustomBehvioralEvent {
=======
import { hubSpotBaseURL } from '../properties'
import type { Payload } from './generated-types'

interface CustomBehavioralEvent {
>>>>>>> CONMAN-199
  eventName: string
  occurredAt?: string | number
  properties?: { [key: string]: unknown }
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
<<<<<<< HEAD
        'The internal event name assigned by HubSpot. This can be found in your HubSpot account. Events must be predefined in HubSpot. Learn how to find the internal name in [HubSpot’s documentation](https://knowledge.hubspot.com/analytics-tools/create-custom-behavioral-events?_ga=2.219778269.578939721.1663963266-497800475.1660075188#define-the-api-call).',
=======
        'The internal event name assigned by HubSpot. This can be found in your HubSpot account. Events must be predefined in HubSpot. Learn how to find the internal name in [HubSpot’s documentation](https://knowledge.hubspot.com/analytics-tools/create-custom-behavioral-events).',
>>>>>>> CONMAN-199
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
<<<<<<< HEAD
    const event: CustomBehvioralEvent = {
=======
    const event: CustomBehavioralEvent = {
>>>>>>> CONMAN-199
      eventName: payload.eventName,
      occurredAt: payload.occurredAt,
      utk: payload.utk,
      email: payload.email,
      objectId: payload.objectId,
      properties: payload.properties
    }
<<<<<<< HEAD
    return request(`${HubSpotBaseURL}/events/v3/send`, {
=======
    return request(`${hubSpotBaseURL}/events/v3/send`, {
>>>>>>> CONMAN-199
      method: 'post',
      json: event
    })
  }
}

export default action
