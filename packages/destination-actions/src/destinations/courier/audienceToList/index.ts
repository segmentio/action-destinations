import { ActionDefinition, ModifiedResponse, RequestOptions } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { getDomain } from '..'

export const CONSTANTS = {
  ADD: 'ADD',
  REMOVE: 'REMOVE'
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync Audience',
  description: 'Sync Engage Audiences to Courier lists',
  defaultSubscription: 'type = "identify" or type = "track"',
  fields: {
    segment_audience_id: {
      label: 'Audience ID',
      description: 'Segment Audience ID to which user identifier should be added or removed',
      type: 'string',
      unsafe_hidden: true,
      required: true,
      default: {
        '@path': '$.context.personas.computation_id'
      }
    },
    segment_audience_key: {
      label: 'Audience Key',
      description: 'Segment Audience key to which user identifier should be added or removed',
      type: 'string',
      unsafe_hidden: true,
      required: true,
      default: {
        '@path': '$.context.personas.computation_key'
      }
    },
    segment_computation_action: {
      label: 'Segment Computation Action',
      description:
        "Segment computation class used to determine if input event is from an Engage Audience'. Value must be = 'audience'.",
      type: 'string',
      unsafe_hidden: true,
      required: true,
      default: {
        '@path': '$.context.personas.computation_class'
      },
      choices: [{ label: 'audience', value: 'audience' }]
    },
    segment_user_id: {
      label: 'Segment User ID',
      description: 'The Segment userId value.',
      type: 'string',
      unsafe_hidden: true,
      required: false,
      default: { '@path': '$.userId' }
    },
    segment_anonymous_id: {
      label: 'Segment Anonymous ID',
      description: 'The Segment anonymousId value.',
      type: 'string',
      unsafe_hidden: true,
      required: false,
      default: { '@path': '$.anonymousId' }
    },
    traits_or_props: {
      label: 'Traits or properties object',
      description: 'A computed object for track and identify events. This field should not need to be edited.',
      type: 'object',
      required: true,
      unsafe_hidden: true,
      default: {
        '@if': {
          exists: { '@path': '$.properties' },
          then: { '@path': '$.properties' },
          else: { '@path': '$.traits' }
        }
      }
    },
    audience_action: {
      label: 'Audience Action',
      description: 'Indicates if the user will be added or removed from the Audience',
      type: 'string',
      unsafe_hidden: true,
      choices: [
        { label: CONSTANTS.ADD, value: CONSTANTS.ADD },
        { label: CONSTANTS.REMOVE, value: CONSTANTS.REMOVE }
      ]
    }
  },
  perform: (request, { payload, settings }) => {
    return processPayload(request, payload, settings)
  }
}

const processPayload = (
  request: <Data = unknown>(url: string, options?: RequestOptions | undefined) => Promise<ModifiedResponse<Data>>,
  payload: Payload,
  settings: Settings
) => {
  payload.audience_action = payload.traits_or_props[payload.segment_audience_key] ? CONSTANTS.ADD : CONSTANTS.REMOVE

  const domain = getDomain(settings.region)

  const list_id = `${payload.segment_audience_key}-${payload.segment_audience_id}`
  const user_id = payload.segment_user_id ?? payload.segment_anonymous_id

  if (payload.audience_action === CONSTANTS.ADD) {
    return request(`${domain}/lists/${list_id}/subscriptions/${user_id}`, {
      method: 'PUT'
    })
  } else {
    return request(`${domain}/lists/${list_id}/subscriptions/${user_id}`, {
      method: 'DELETE'
    })
  }
}

export default action
