import { PayloadValidationError, RequestClient } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { HEAP_LIBRARY, HEAP_SEGMENT_CLOUD_LIBRARY_NAME, getHeapBaseUrl } from './constants'
import type { AddUserPropertiesJSON, FlatProperties, HeapTrackEvent, TrackJSON, UserIdentifier } from './types'

export function send(request: RequestClient, settings: Settings, payload: Payload) {
  const { appId, region } = settings
  const { identity, type, properties, name, timestamp, message_id, traits } = payload

  const baseUrl = getHeapBaseUrl(region)
  const requests: Promise<unknown>[] = []

  const trimmedIdentity = hasValue(identity) ? identity.trim() : undefined
  const hasUserTraits = hasTraits(traits)

  // Identify calls exist solely to update the user profile, which is keyed on identity.
  if (type === 'identify' && trimmedIdentity === undefined) {
    throw new PayloadValidationError('Identity is required for identify calls.')
  }

  // A profile update needs an identity to attach the traits to.
  if (hasUserTraits && trimmedIdentity === undefined) {
    throw new PayloadValidationError('Identity is required when User Properties are provided.')
  }

  if (hasUserTraits && trimmedIdentity !== undefined) {
    const json: AddUserPropertiesJSON = {
      app_id: appId,
      library: HEAP_LIBRARY,
      users: [
        {
          user_identifier: {
            identity: trimmedIdentity
          },
          custom_properties: flat(traits)
        }
      ]
    }

    requests.push(
      request(`${baseUrl}/api/integrations/add_user_properties`, {
        method: 'post',
        json
      })
    )
  }

  if (type !== 'identify') {
    const event: HeapTrackEvent = {
      event: getEventName(payload),
      user_identifier: getUserIdentifier(payload),
      custom_properties: {
        segment_library: HEAP_SEGMENT_CLOUD_LIBRARY_NAME,
        ...flat(properties || {}),
        ...(hasValue(name) ? { name } : {})
      },
      idempotency_key: message_id,
      ...(timestamp ? { timestamp } : {})
    }

    const json: TrackJSON = {
      app_id: appId,
      library: HEAP_LIBRARY,
      events: [event]
    }

    requests.push(
      request(`${baseUrl}/api/integrations/track`, {
        method: 'post',
        json
      })
    )
  }

  return Promise.all(requests)
}

export function flat(data: Payload['properties'], prefix = ''): FlatProperties {
  let result: FlatProperties = {}
  for (const key in data) {
    if (typeof data[key] === 'object' && data[key] !== null) {
      result = { ...result, ...flat(data[key] as Payload['properties'], prefix + '.' + key) }
    } else {
      result[(prefix + '.' + key).replace(/^\./, '')] = stringify(data[key])
    }
  }
  return result
}

function stringify(value: unknown): string {
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return value.toString()
  }
  return JSON.stringify(value)
}

export const hasValue = (value?: string | null): value is string => typeof value === 'string' && value.trim().length > 0

export const hasTraits = (traits: Payload['traits']): boolean =>
  traits != null && Object.values(traits).some((v) => (typeof v === 'string' ? v.trim().length > 0 : v != null))

export const getUserIdentifier = (payload: Payload): UserIdentifier => {
  const { identity, anonymous_id, user_id, email } = payload

  const userIdentifier: UserIdentifier = {
    ...(hasValue(identity) ? { identity: identity.trim() } : {}),
    ...(hasValue(anonymous_id) ? { anonymous_id: anonymous_id.trim() } : {}),
    ...(hasValue(user_id) ? { user_id: user_id.trim() } : {}),
    ...(hasValue(email) ? { email: email.trim() } : {})
  }

  if (Object.keys(userIdentifier).length === 0) {
    throw new PayloadValidationError('At least one of Identity, Anonymous ID, User ID or Email is required.')
  }
  return userIdentifier
}

export const getEventName = ({ type, event }: { type?: string; event?: string }): string => {
  switch (type) {
    case 'page':
      return 'Page viewed'
    case 'screen':
      return 'Screen viewed'
    default:
      return event || 'track'
  }
}
