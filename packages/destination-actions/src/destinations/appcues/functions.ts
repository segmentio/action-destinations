import type { RequestClient } from '@segment/actions-core'
import type { Settings } from './generated-types'
import type { Payload } from './send/generated-types'
import type { AppcuesRequest } from './types'

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

export async function performSend(request: RequestClient, payload: Payload, settings: Settings) {
  const { endpoint, apiKey } = settings
  const {
    userId,
    anonymousId,
    event,
    properties,
    user_traits,
    groupId,
    group_traits,
    context,
    integrations,
    timestamp,
    messageId
  } = payload

  const requests: Promise<any>[] = []

  // Send track event if event is present
  if (event) {
    const trackRequest: AppcuesRequest = {
      type: 'track',
      event,
      ...(userId ? { userId } : {}),
      ...(anonymousId ? { anonymousId } : {}),
      ...(properties ? { properties } : {}),
      ...(context ? { context } : {}),
      ...(integrations ? { integrations } : {}),
      ...(timestamp ? { timestamp } : {}),
      ...(messageId ? { messageId } : {})
    }

    requests.push(sendToAppcues(request, endpoint, apiKey, trackRequest))
  }

  // Send identify event if user_traits is present and has properties
  if (user_traits && Object.keys(user_traits).length > 0) {
    const identifyRequest: AppcuesRequest = {
      type: 'identify',
      traits: user_traits,
      ...(userId ? { userId } : {}),
      ...(anonymousId ? { anonymousId } : {}),
      ...(context ? { context } : {}),
      ...(integrations ? { integrations } : {}),
      ...(timestamp ? { timestamp } : {}),
      ...(messageId ? { messageId } : {})
    }

    requests.push(sendToAppcues(request, endpoint, apiKey, identifyRequest))
  }

  // Send group event if groupId is present
  if (groupId) {
    const groupRequest: AppcuesRequest = {
      type: 'group',
      groupId,
      ...(userId ? { userId } : {}),
      ...(anonymousId ? { anonymousId } : {}),
      ...(group_traits && Object.keys(group_traits).length > 0 ? { traits: group_traits } : {}),
      ...(context ? { context } : {}),
      ...(integrations ? { integrations } : {}),
      ...(timestamp ? { timestamp } : {}),
      ...(messageId ? { messageId } : {})
    }

    requests.push(sendToAppcues(request, endpoint, apiKey, groupRequest))
  }

  // Execute all requests in parallel
  if (requests.length === 0) {
    throw new Error('No valid data to send. At least one of event, user_traits, or groupId must be provided.')
  }

  await Promise.all(requests)
}
