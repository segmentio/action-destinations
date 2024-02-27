import type { ActionDefinition } from '@segment/actions-core'
import dayjs from '../../../lib/dayjs'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { customEventRequestParams } from '../request-params'
import { normalizePropertyNames } from '../vars'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'Track events',
  platform: 'cloud',
  defaultSubscription: 'type = "track"',
  fields: {
    userId: {
      type: 'string',
      required: true,
      description: "The user's id",
      label: 'User ID',
      default: {
        '@path': '$.userId'
      }
    },
    name: {
      description: 'The name of the event.',
      label: 'Name',
      required: true,
      type: 'string',
      default: {
        '@path': '$.event'
      }
    },
    properties: {
      description: 'A JSON object containing additional information about the event that will be indexed by FullStory.',
      label: 'Properties',
      required: false,
      type: 'object',
      default: {
        '@path': '$.properties'
      }
    },
    timestamp: {
      description:
        'The date and time when the event occurred. If not provided, the current FullStory server time will be used.',
      label: 'Timestamp',
      required: false,
      type: 'datetime',
      default: {
        '@path': '$.timestamp'
      }
    },
    useRecentSession: {
      description:
        "Set to true if the custom event should be attached to the user's most recent session. The most recent session must have had activity within the past 30 minutes.",
      label: 'Use Recent Session',
      required: false,
      type: 'boolean'
    },
    sessionUrl: {
      description:
        'If known, the FullStory session playback URL to which the event should be attached, as returned by the FS.getCurrentSessionURL() client API.',
      label: 'Session URL',
      required: false,
      type: 'string'
    }
  },
  perform: (request, { payload, settings }) => {
    const { userId, name, properties, timestamp, useRecentSession, sessionUrl } = payload
    const utcTimestamp = timestamp ? dayjs.utc(timestamp) : undefined

    const { url, options } = customEventRequestParams(settings, {
      userId,
      eventName: name,
      eventData: normalizePropertyNames(properties, { typeSuffix: true }),
      timestamp: utcTimestamp && utcTimestamp.isValid() ? utcTimestamp.toISOString() : undefined,
      useRecentSession,
      sessionUrl
    })
    return request(url, options)
  }
}

export default action
