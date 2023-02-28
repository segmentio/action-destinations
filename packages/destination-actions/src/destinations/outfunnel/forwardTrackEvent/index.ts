import { ActionDefinition } from '@segment/actions-core';
import type { Settings } from '../generated-types';
import type { Payload } from './generated-types';
import { getEndpoint } from '../utils';

const action: ActionDefinition<Settings, Payload> = {
  title: 'Forward track event',
  description: 'Forward track event to outfunnel',
  defaultSubscription: 'type = "track"',
  fields: {
    action: {
      type: 'hidden',
      required: true,
      description: 'Indicates which action was triggered',
      label: 'Action name',
      default: 'track'
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
      type: 'hidden',
      description: 'The identifier of the user who performed the event',
      label: 'User ID',
      default: {
        '@path': '$.userId'
      }
    },
    anonymous_id: {
      type: 'hidden',
      description: 'Anonymous ID of the user',
      label: 'Anonymous ID',
      default: {
        '@path': '$.anonymousId'
      }
    },
    group_id: {
      type: 'string',
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
        '@if': {
          exists: { '@path': '$.context.traits.email' },
          then: { '@path': '$.context.traits.email' },
          else: { '@path': '$.properties.email' }
        }
      }
    },
    timestamp: {
      type: 'hidden',
      required: true,
      description: 'The time the event occured in UTC',
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
