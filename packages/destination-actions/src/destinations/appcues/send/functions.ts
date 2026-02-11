import type { RequestClient } from '@segment/actions-core'
import { PayloadValidationError } from '@segment/actions-core'
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
  const { region, apiKey, accountId } = settings

  if (!REGION_ENDPOINTS[region]) {
    throw new PayloadValidationError(
      `Invalid region: ${region}. Must be one of: ${Object.keys(REGION_ENDPOINTS).join(', ')}`
    )
  }

  const endpoint = `${REGION_ENDPOINTS[region]}/v2/accounts/${accountId}/segment/direct`

  const { type, event, name, properties, user_traits, groupId, group_traits } = payload
  const baseFields = buildBaseFields(payload)
  const requests: Promise<unknown>[] = []

  if (type === 'track') {
    if (!event) {
      throw new PayloadValidationError('Event name is required for track events')
    }
    const trackRequest: AppcuesTrackRequest = {
      type: 'track',
      event,
      ...(properties ? { properties } : {}),
      ...baseFields
    }
    requests.push(sendToAppcues(request, endpoint, apiKey, trackRequest))
  }

  if (type === 'page') {
    const pageRequest: AppcuesPageRequest = {
      type: 'page',
      ...(name ? { name } : {}),
      ...(properties ? { properties } : {}),
      ...baseFields
    }
    requests.push(sendToAppcues(request, endpoint, apiKey, pageRequest))
  }

  if (type === 'screen') {
    const screenRequest: AppcuesScreenRequest = {
      type: 'screen',
      ...(name ? { name } : {}),
      ...(properties ? { properties } : {}),
      ...baseFields
    }
    requests.push(sendToAppcues(request, endpoint, apiKey, screenRequest))
  }

  if (
    type === 'identify' ||
    (['track', 'page', 'screen'].includes(type) && user_traits && Object.keys(user_traits).length > 0)
  ) {
    const identifyRequest: AppcuesIdentifyRequest = {
      type: 'identify',
      ...(user_traits && Object.keys(user_traits).length > 0 ? { traits: user_traits } : {}),
      ...baseFields
    }
    requests.push(sendToAppcues(request, endpoint, apiKey, identifyRequest))
  }

  if (groupId && (type === 'group' || ['track', 'page', 'screen'].includes(type))) {
    const groupRequest: AppcuesGroupRequest = {
      type: 'group',
      groupId,
      ...(group_traits && Object.keys(group_traits).length > 0 ? { traits: group_traits } : {}),
      ...baseFields
    }
    requests.push(sendToAppcues(request, endpoint, apiKey, groupRequest))
  }

  await Promise.all(requests)
}
