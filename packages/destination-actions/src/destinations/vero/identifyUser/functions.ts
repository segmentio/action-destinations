import { PayloadValidationError } from '@segment/actions-core'
import { resolveIdentity, stringifyRecord, toISODate, trim } from '../functions'
import type { Payload } from './generated-types'
import type { IdentifyJSON } from './types'

const RESERVED_KEYS = ['timezone', 'language', 'userAgent']

type Channels = NonNullable<IdentifyJSON['channels']>
type Topics = NonNullable<IdentifyJSON['preferences']>['topics']

function buildChannels(pushDevices: Payload['pushDevices']): Channels {
  return (pushDevices ?? []).flatMap(({ token, platform }) => {
    const address = trim(token)
    const devicePlatform = trim(platform)
    return address && devicePlatform
      ? [{ type: 'push' as const, address, platform: devicePlatform as 'ios' | 'android' }]
      : []
  })
}

function buildTopics(topicPreferences: Payload['topicPreferences']): Topics {
  return (topicPreferences ?? []).map(({ id, name, status }) => {
    const topicStatus = status as 'subscribed' | 'unsubscribed'
    const topicName = trim(name)
    if (id !== undefined && topicName) {
      throw new PayloadValidationError('Topic Preference accepts either an ID or a name, not both.')
    }
    if (id !== undefined) {
      return { id, status: topicStatus }
    }
    if (!topicName) {
      throw new PayloadValidationError('Topic Preference requires an ID or a name.')
    }
    return { name: topicName, status: topicStatus }
  })
}

function buildData(
  userProperties: Payload['userProperties'],
  language: Payload['language'],
  userAgent: Payload['userAgent'],
  timezone: Payload['timezone']
): IdentifyJSON['data'] {
  const trimmedLanguage = trim(language)
  const trimmedUserAgent = trim(userAgent)
  const properties: Record<string, string> = {
    ...stringifyRecord(userProperties, RESERVED_KEYS),
    ...(trimmedLanguage ? { language: trimmedLanguage } : {}),
    ...(trimmedUserAgent ? { userAgent: trimmedUserAgent } : {})
  }
  if (timezone !== undefined) {
    return Object.assign(properties, { timezone })
  }
  return Object.keys(properties).length > 0 ? properties : undefined
}

export function buildJSON(payload: Payload): IdentifyJSON {
  const {
    userId,
    email,
    userProperties,
    timezone,
    language,
    userAgent,
    pushDevices,
    createdAt,
    updateOnly,
    topicPreferences
  } = payload

  const identity = resolveIdentity(userId, email)
  const channels = buildChannels(pushDevices)
  const topics = buildTopics(topicPreferences)
  const data = buildData(userProperties, language, userAgent, timezone)
  const timestamp = toISODate(createdAt)

  const json: IdentifyJSON = {
    ...identity,
    ...(channels.length > 0 ? { channels } : {}),
    ...(data ? { data } : {}),
    ...(timestamp || updateOnly
      ? {
          extras: {
            ...(timestamp ? { created_at: timestamp } : {}),
            ...(updateOnly ? { update_only: 'true' as const } : {})
          }
        }
      : {}),
    ...(topics.length > 0 ? { preferences: { topics } } : {})
  }

  return json
}
