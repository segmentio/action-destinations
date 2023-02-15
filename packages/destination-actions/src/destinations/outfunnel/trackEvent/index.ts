import { ActionDefinition } from '@segment/actions-core';
import type { Settings } from '../generated-types';
import type { Payload } from './generated-types';
import { getEndpoint } from '../utils';

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'Submit an event to Outfunnel',
  defaultSubscription: 'type = "track"',
  fields: {
    type: {
      type: 'string',
      required: true,
      description: 'Type of the event',
      label: 'Event type',
      default: {
        '@path': '$.type'
      }
    },
    event_name: {
      type: 'string',
      required: true,
      description: 'The name of the event that occured',
      label: 'Event name',
      default: {
        '@path': '$.event'
      }
    },
    user_id: {
      type: 'string',
      required: true,
      description: 'The identifier of the user who performed the event.',
      label: 'User ID',
      default: {
        '@path': '$.userId'
      }
    },
    group_id: {
      type: 'string',
      required: true,
      description: 'The identifier of the group where user belongs to',
      label: 'Group ID',
      default: {
        '@path': '$.context.groupId'
      }
    },
    email: {
      type: 'string',
      required: true,
      description: 'Email address of the user who performed the event',
      label: 'Email Address',
      default: {
        '@path': '$.email'
      }
    },
    timestamp: {
      type: 'datetime',
      required: true,
      description: 'The time the event occured as UTC unix timestamp',
      label: 'Event timestamp',
      default: {
        '@path': '$.timestamp'
      }
    },
    properties: {
      type: 'object',
      description: 'Optional metadata describing the event',
      label: 'Event properties',
      default: {
        '@path': '$.properties'
      }
    },
    context: {
      type: 'object',
      description: 'Event context',
      label: 'Event context',
      required: true,
      default: {
        '@path': '$.context'
      }
    }
  },
  perform: async (request, { settings, payload }) => {
    const endpoint = getEndpoint(settings.userId);

    return request(endpoint, {
      method: 'POST',
      json: payload
    })
  }
}

export default action;
