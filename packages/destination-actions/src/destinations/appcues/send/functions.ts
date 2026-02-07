import type { RequestClient } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type {
  AppcuesRequest,
  AppcuesTrackRequest,
  AppcuesPageRequest,
  AppcuesScreenRequest,
  AppcuesIdentifyRequest,
  AppcuesGroupRequest
} from './types'
import { REGION_ENDPOINTS } from '../constants'

export async function sendToAppcues(request: RequestClient, endpoint: string, apiKey: string, data: AppcuesRequest) {
  return request(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    json: data
  })
}

function buildBaseFields(payload: Payload) {
  const { userId, anonymousId, context, integrations, timestamp, messageId } = payload
  return {
    ...(userId ? { userId } : {}),
    ...(anonymousId ? { anonymousId } : {}),
    ...(context ? { context } : {}),
    ...(integrations ? { integrations } : {}),
    ...(timestamp ? { timestamp } : {}),
    ...(messageId ? { messageId } : {})
  }
}

export async function send(request: RequestClient, payload: Payload, settings: Settings) {
  const { region, apiKey } = settings
  const endpoint = REGION_ENDPOINTS[region]

  if (!endpoint) {
    throw new Error(`Invalid region: ${region}. Must be one of: ${Object.keys(REGION_ENDPOINTS).join(', ')}`)
  }

  const { type, event, name, properties, user_traits, groupId, group_traits } = payload

  const requests: Promise<unknown>[] = []
  const baseFields = buildBaseFields(payload)

  // Send primary event based on type
  switch (type) {
    case 'track': {
      if (!event) {
        throw new Error('Event name is required for track events')
      }
      const trackRequest: AppcuesTrackRequest = {
        type: 'track',
        event,
        ...(properties ? { properties } : {}),
        ...baseFields
      }
      requests.push(sendToAppcues(request, endpoint, apiKey, trackRequest))
      break
    }

    case 'page': {
      const pageRequest: AppcuesPageRequest = {
        type: 'page',
        ...(name ? { name } : {}),
        ...(properties ? { properties } : {}),
        ...baseFields
      }
      requests.push(sendToAppcues(request, endpoint, apiKey, pageRequest))
      break
    }

    case 'screen': {
      const screenRequest: AppcuesScreenRequest = {
        type: 'screen',
        ...(name ? { name } : {}),
        ...(properties ? { properties } : {}),
        ...baseFields
      }
      requests.push(sendToAppcues(request, endpoint, apiKey, screenRequest))
      break
    }

    case 'identify': {
      const identifyRequest: AppcuesIdentifyRequest = {
        type: 'identify',
        ...(user_traits && Object.keys(user_traits).length > 0 ? { traits: user_traits } : {}),
        ...baseFields
      }
      requests.push(sendToAppcues(request, endpoint, apiKey, identifyRequest))
      break
    }

    case 'group': {
      if (groupId) {
        const groupRequest: AppcuesGroupRequest = {
          type: 'group',
          groupId,
          ...(group_traits && Object.keys(group_traits).length > 0 ? { traits: group_traits } : {}),
          ...baseFields
        }
        requests.push(sendToAppcues(request, endpoint, apiKey, groupRequest))
      }
      break
    }

    default:
      throw new Error(`Invalid event type: ${type}. Must be one of: track, page, screen, identify, group`)
  }

  // Send identify event if user_traits is present (for track, page, screen events)
  if (type !== 'identify' && user_traits && Object.keys(user_traits).length > 0) {
    const identifyRequest: AppcuesIdentifyRequest = {
      type: 'identify',
      traits: user_traits,
      ...baseFields
    }
    requests.push(sendToAppcues(request, endpoint, apiKey, identifyRequest))
  }

  // Send group event if groupId and group_traits are present (for non-group events)
  if (type !== 'group' && groupId && group_traits && Object.keys(group_traits).length > 0) {
    const groupRequest: AppcuesGroupRequest = {
      type: 'group',
      groupId,
      traits: group_traits,
      ...baseFields
    }
    requests.push(sendToAppcues(request, endpoint, apiKey, groupRequest))
  }

  // Execute all requests in parallel
  await Promise.all(requests)
}
