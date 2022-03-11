import { ActionDefinition } from '@segment/actions-core'
import { getAudienceId, patchAudience } from '../criteo-audiences'
import type { Operation, RequestFn, ClientCredentials } from '../criteo-audiences'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const getOperationFromPayload = async (
  request: RequestFn,
  advertiser_id: string,
  payload: Payload[],
  credentials: ClientCredentials
): Promise<Operation> => {
  const add_user_list: string[] = [];
  let audience_key = '';
  for (const event of payload) {
    if (!audience_key && event.audience_key)
      audience_key = event.audience_key;
    if (event.email)
      add_user_list.push(event.email);
  }

  const audience_id = await getAudienceId(request, advertiser_id, audience_key, credentials)
  const operation: Operation = {
    operation_type: "add",
    audience_id: audience_id,
    user_list: add_user_list,
  }
  return operation;
}

const processPayload = async (
  request: RequestFn,
  settings: Settings,
  payload: Payload[]
): Promise<Response> => {
  const credentials: ClientCredentials = {
    client_id: settings.client_id,
    client_secret: settings.client_secret
  }
  const operation: Operation = await getOperationFromPayload(request, settings.advertiser_id, payload, credentials);
  return await patchAudience(request, operation, credentials)

}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Add users to Audience',
  description: 'Add users from Criteo audience by connecting to Criteo API',
  defaultSubscription: 'type = "track" and event = "Audience Entered"',
  fields: {
    audience_key: {
      label: 'Audience key',
      description: "Unique name for personas audience",
      type: 'string',
      default: {
        '@path': '$.properties.audience_key'
      }
    },
    event: {
      label: 'Event name',
      description: "Event for audience entering or exiting",
      type: 'string',
      default: {
        '@path': '$.event'
      }
    },
    email: {
      label: 'Email',
      description: "The user's email",
      type: 'string',
      format: 'email',
      default: {
        '@path': '$.context.traits.email'
      }
    },
  },
  perform: async () => {
    return
  },

  performBatch: async (request, { settings, payload }) => {
    console.time('perform time');
    const response = await processPayload(request, settings, payload);
    console.timeEnd('perform time');
    return response;
  }
}
export default action
