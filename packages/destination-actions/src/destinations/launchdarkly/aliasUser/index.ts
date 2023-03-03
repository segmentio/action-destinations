import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { getEventsUrl, parseTimestamp } from '../utils'
import type { Payload } from './generated-types'

type LDIdentifyEvent = {
  kind: 'identify'
  context: { [k: string]: { key: string } | 'multi' }
  creationDate: number
}

const convertPayloadToLDEvent = (payload: Payload): LDIdentifyEvent => {
  const identifiedContextKind = payload.identified_context_kind || 'user'
  const unauthenticatedContextKind = payload.unauthenticated_context_kind || 'unauthenticatedUser'

  return {
    kind: 'identify',
    context: {
      kind: 'multi',
      [identifiedContextKind]: {
        key: payload.user_key
      },
      [unauthenticatedContextKind]: {
        key: payload.previous_key
      }
    },
    creationDate: parseTimestamp(payload.timestamp)
  }
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Alias User',
  description: 'Alias an anonymous user with an identified user key.',
  defaultSubscription: 'type = "identify" or type = "alias"',
  fields: {
    identified_context_kind: {
      label: 'Identified context kind',
      type: 'string',
      required: true,
      description:
        'The LaunchDarkly context kind used for identified users. To learn more, read [Contexts and segments](https://docs.launchdarkly.com/home/contexts).',
      default: 'user'
    },
    user_key: {
      label: 'User key',
      type: 'string',
      required: true,
      description: "The user's unique key.",
      default: {
        '@path': '$.userId'
      }
    },
    unauthenticated_context_kind: {
      label: 'Unauthenticated context kind',
      type: 'string',
      required: true,
      description:
        'The LaunchDarkly context kind used for unauthenticated users. To learn more, read [Contexts and segments](https://docs.launchdarkly.com/home/contexts).',
      default: 'unauthenticatedUser'
    },
    previous_key: {
      label: 'Anonymous ID',
      type: 'string',
      required: true,
      description: "The user's unauthenticated identifier.",
      default: {
        '@if': {
          exists: { '@path': '$.previousId' },
          then: { '@path': '$.previousId' },
          else: { '@path': '$.anonymousId' }
        }
      }
    },
    timestamp: {
      label: 'Event Timestamp',
      description: 'The time when the event happened. Defaults to the current time.',
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

export default action
