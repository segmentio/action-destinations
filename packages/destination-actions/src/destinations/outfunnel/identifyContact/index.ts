import { ActionDefinition } from '@segment/actions-core';
import type { Settings } from '../generated-types';
import type { Payload } from './generated-types';
import { getEndpoint } from '../utils';

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify Contact',
  description: 'Create or update contact in Outfunnel',
  defaultSubscription: 'type = "identify"',
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
    user_id: {
      type: 'string',
      required: true,
      description: 'The identifier of the user',
      label: 'User ID',
      default: {
        '@path': '$.userId'
      }
    },
    anonymous_id: {
      type: 'string',
      description: 'Anonymous ID of the user',
      label: 'Anonymous ID',
      default: {
        '@path': '$.anonymousId'
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
    traits: {
      type: 'object',
      description: 'Optional metadata describing the user',
      label: 'User traits',
      default: {
        '@path': '$.traits'
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
    });
  }
}

export default action
