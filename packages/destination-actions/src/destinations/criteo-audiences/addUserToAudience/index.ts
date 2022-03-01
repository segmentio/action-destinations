import { ActionDefinition } from '@segment/actions-core'
import { getAudienceId, patchAudience } from '../criteo-audiences'
import type { Operation, RequestFn } from '../criteo-audiences'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const getOperationFromPayload = async (
  request: RequestFn,
  advertiser_id: string,
  payload: Payload[]
): Promise<Operation> => {
  let user_list: string[] = [];
  let audience_key: string = undefined;

  for (const event of payload) {
    if (!audience_key && event.audience_key)
      audience_key = event.audience_key;
    if (event.email)
      user_list.push(event.email);
  }

  const audience_id = await getAudienceId(request, advertiser_id, audience_key)

  let operation: Operation = {
    operation_type: "add",
    audience_id: audience_id,
    user_list: user_list,
  }
  return operation;
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
      allowNull: true,
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
        '@path': '$.traits.email'
      }
    },
  },
  perform: () => {
    return
  },
  performBatch: async (request, { settings, payload }) => {
    let operation: Operation = await getOperationFromPayload(request, settings.advertiser_id, payload);
    patchAudience(request, operation);
  }
}

export default action
