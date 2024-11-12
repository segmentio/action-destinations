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
      description: 'Timestamp of when the action occurred in ISO 8601 format.',
      type: 'string', 
      required: false,
        default: {
            '@path': '$.timestamp'
        }
    },
    phone: {
      label: 'Phone',
      description: 'Phone number of the user associated with the action. E.164 format is required. This field is required if either email or an externalIdentifier is not provided.',
      type: 'string',
      required: false,
    },
    email: {
      label: 'Email',
      description: 'Email of the user associated with the action. This field is required if either phone or an externalIdentifier is not provided.',
      type: 'string',
      required: false,
    default: {
        '@path': '$.email'
    }
    },
    clientUserId: {
      label: 'clientUserId',
      description: '(optional) Your primary ID for a user. This field is required if either phone, email, or a customIdentifier is not provided.',
      type: 'string',
      required: false,
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

