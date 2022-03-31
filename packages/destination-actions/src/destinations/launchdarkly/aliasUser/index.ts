import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { getEventsUrl, parseTimestamp } from '../utils'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Alias User',
  description: 'Alias an anonymous user with an identified user key.',
  defaultSubscription: 'type = "identify" or type = "alias"',
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
    previous_key: {
      label: 'Anonymous ID',
      type: 'string',
      required: true,
      description: "The user's previously used anonymous user key",
      default: {
        '@if': {
          exists: { '@path': '$.previousId' },
          then: { '@path': '$.previousId' },
          else: { '@path': '$.anonymousId' }
        }
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

type LDAliasEvent = {
  kind: 'alias'
  key: string
  previousKey: string
  contextKind: 'user'
  previousContextKind: 'anonymousUser'
  creationDate: number
}

const convertPayloadToLDEvent = (payload: Payload): LDAliasEvent => {
  return {
    kind: 'alias',
    key: payload.user_key,
    previousKey: payload.previous_key,
    contextKind: 'user',
    previousContextKind: 'anonymousUser',
    creationDate: parseTimestamp(payload.timestamp)
  }
}

export default action
