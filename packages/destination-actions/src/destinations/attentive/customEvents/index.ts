import type { ActionDefinition } from '@segment/actions-core';
import type { Settings } from '../generated-types';
import type { Payload } from './generated-types';

const action: ActionDefinition<Settings, Payload> = {
  title: 'Custom Events',
  description: 'Send user actions to Attentive',
  fields: {
    type: {
      label: 'Type',
      description: 'The type of event. This name is case sensitive. "Order shipped" and "Order Shipped" would be considered different event types.',
      type: 'string',
      required: true,
        default: {
            '@path': '$.event'
        }
    },
    properties: {
      label: 'Properties',
      description: 'Metadata to associate with the event.',
      type: 'object',
      required: false,
        default: {
            '@path': '$.properties'
        }
    },
    externalEventId: {
      label: 'External Event Id',
      description: 'A unique identifier for the event.',
      type: 'string',
      required: false,
    },
    occurredAt: {
      label: 'Occurred At',
      description: 'Timestamp for the event, ISO 8601 format.',
      type: 'string', 
      required: false,
        default: {
            '@path': '$.timestamp'
        }
    },
    phone: {
      label: 'Phone',
      description: "The user's phone number in E.164 format. Required if none of 'Client User ID', 'Email' or 'External Event Id' are provided.",
      type: 'string',
      required: false,
    },
    email: {
      label: 'Email',
      description: 'The user's email address. Required if none of 'Client User ID', 'Phone' or 'External Event Id' are provided.',
      type: 'string',
      required: false,
default: {
        '@if': {
          exists: { '@path': '$.properties.email' },
          then: { '@path': '$.properties.email' },
          else: { '@path': '$.context.traits.email' }
        }
}
    },
    clientUserId: {
      label: 'Client User ID',
      description: "A primary ID for a user. Required if none of 'Phone', 'Email' or 'External Event Id' are provided.',
      type: 'string',
      required: false,
      default: { '@path': '$.userId' }
    },
    customIdentifiers: {
      label: 'customIdentifiers',
      description: '(optional) Namespaced custom identifiers and their values. This field is required if either phone, email, or a clientUserId is not provided.',
      type: 'object',
      required: false,
    },
  },
  perform: (request, data) => {
    return request('https://api.attentivemobile.com/v1/events/custom', {
      method: 'post',
    json: {
    type: data.payload.type,
        properties: data.payload.properties,
        externalEventId: data.payload.externalEventId,
        occurredAt: data.payload.occurredAt,
        user: {
            phone: data.payload.phone,
            email: data.payload.email,
            externalIdentifiers: {
                clientUserId: data.payload.clientUserId,
                customIdentifiers: data.payload.customIdentifiers
            }
        }
        }
    });
  },
};

export default action;

