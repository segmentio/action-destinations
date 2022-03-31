import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { getEventsUrl, parseTimestamp } from '../utils'
import type { Payload } from './generated-types'

type LDAliasEvent = {
  kind: 'alias'
  key: string
  previousKey: string
  contextKind: 'user'
  previousContextKind: 'anonymousUser'
  creationDate: number
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify User',
  description: '',
  defaultSubscription: 'type = "identify"',
  fields: {
    user_key: {
      label: 'User key',
      type: 'string',
      required: true,
      description: 'The LaunchDarkly user key',
      default: {
        '@path': '$.userId'
      }
    },
    anonymous_id: {
      label: 'Anonymous ID',
      type: 'string',
      required: true,
      description: 'The previously used anonymous UUID',
      default: {
        '@path': '$.anonymousId'
      }
    },
    timestamp: {
      label: 'Event timestamp',
      description: 'Time of when the actual event happened.',
      type: 'datetime',
      default: {
        '@path': '$.timestamp'
      }
    }
  },
  perform: (request, { payload, settings }) => {
    const event = convertPayloadToLDEvent(payload)

    return request(getEventsUrl(settings.client_id), {
      method: 'post',
      json: [event]
    })
  }
}

const convertPayloadToLDEvent = (payload: Payload): LDAliasEvent => {
  return {
    kind: 'alias',
    key: payload.user_key,
    previousKey: payload.anonymous_id,
    contextKind: 'user',
    previousContextKind: 'anonymousUser',
    creationDate: parseTimestamp(payload.timestamp)
  }
}

export default action
