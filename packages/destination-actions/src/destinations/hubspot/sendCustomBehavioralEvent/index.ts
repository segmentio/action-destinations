import { ActionDefinition, PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { HUBSPOT_BASE_URL } from '../properties'
import type { Payload } from './generated-types'
import { flattenObject, transformEventName } from '../utils'

interface CustomBehavioralEvent {
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
        'The internal event name assigned by HubSpot. This can be found in your HubSpot account. Events must be predefined in HubSpot. Please input the full internal event name including the `pe` prefix (i.e. `pe<HubID>_event_name`). Learn how to find the internal name in [HubSpot’s documentation](https://knowledge.hubspot.com/analytics-tools/create-custom-behavioral-events).',
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
        'Default or custom properties that describe the event. On the left-hand side, input the internal name of the property as seen in your HubSpot account. On the right-hand side, map the Segment field that contains the value. See more information in [HubSpot’s documentation](https://knowledge.hubspot.com/analytics-tools/create-custom-behavioral-events#add-and-manage-event-properties).',
      type: 'object',
      defaultObjectUI: 'keyvalue:only'
    }
  },
  perform: (request, { payload, settings, features }) => {
    const shouldTransformEventName = features && features['actions-hubspot-event-name']
    const eventName = shouldTransformEventName ? transformEventName(payload.eventName) : payload.eventName

    const event: CustomBehavioralEvent = {
      eventName: eventName,
      occurredAt: payload.occurredAt,
      utk: payload.utk,
      email: payload.email,
      objectId: payload.objectId,
      properties: flattenObject(payload.properties)
    }

    const hubId = settings?.portalId
    const regExp = /^pe\d+_.*/

    if (!hubId && !regExp.exec(event?.eventName)) {
      throw new PayloadValidationError(`EventName should begin with pe<hubId>_`)
    }
    if (hubId && !event?.eventName.startsWith(`pe${hubId}_`)) {
      throw new PayloadValidationError(`EventName should begin with pe${hubId}_`)
    }

    if (!payload.utk && !payload.email && !payload.objectId) {
      throw new PayloadValidationError(`One of the following parameters: email, user token, or objectId is required`)
    }

    return request(`${HUBSPOT_BASE_URL}/events/v3/send`, {
      method: 'post',
      json: event
    })
  }
}

export default action
