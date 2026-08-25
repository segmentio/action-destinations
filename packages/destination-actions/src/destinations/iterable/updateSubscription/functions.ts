import {
  PayloadValidationError,
  RequestClient,
  MultiStatusResponse,
  JSONLikeObject,
  HTTPError,
  ModifiedResponse,
  DEFAULT_REQUEST_TIMEOUT
} from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { DataCenterLocation } from '../shared-fields'
import { getRegionalBaseUrl } from '../utils'
import { MIN_REQUEST_TIMEOUT } from './constants'
import type { ResolvedIdentifier, BulkSubscriptionRequestBody } from './types'

export async function performUpdateSubscriptions(request: RequestClient, payload: Payload, settings: Settings) {
  const { subscription_group_type, subscription_group_id, action } = payload.subscription
  const identifier = resolveIdentifier(payload)

  const endpoint = getSingleUserEndpoint(settings, subscription_group_type, subscription_group_id, identifier)
  const method = action === 'subscribe' ? 'patch' : 'delete'
  return request(endpoint, { method, timeout: Math.max(MIN_REQUEST_TIMEOUT, DEFAULT_REQUEST_TIMEOUT) })
}

export async function performBatchUpdateSubscriptions(request: RequestClient, payloads: Payload[], settings: Settings) {
  const multiStatusResponse = new MultiStatusResponse()
  const validPayloads: { index: number; identifier: ResolvedIdentifier }[] = []

  payloads.forEach((payload, index) => {
    try {
      const identifier = resolveIdentifier(payload)
      validPayloads.push({ index, identifier })
    } catch (error) {
      multiStatusResponse.setErrorResponseAtIndex(index, {
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: (error as Error).message
      })
    }
  })

  if (validPayloads.length === 0) {
    return multiStatusResponse
  }

  // All payloads in a batch are grouped by the `subscription` batch key (see `batch_keys` default in
  // index.ts), so every payload here is guaranteed to share the same `subscription` config.
  const subscription = payloads[validPayloads[0].index].subscription
  const referenceKey = JSON.stringify(subscription)
  const hasMismatchedSubscriptions = validPayloads.some(
    ({ index }) => JSON.stringify(payloads[index].subscription) !== referenceKey
  )
  if (hasMismatchedSubscriptions) {
    throw new PayloadValidationError(
      'All events in a batch must share the same subscription preference. Received a batch with differing subscriptions, which is not supported.'
    )
  }

  const users = validPayloads
    .filter(({ identifier }) => identifier.email)
    .map(({ identifier }) => identifier.email as string)
  const usersByUserId = validPayloads
    .filter(({ identifier }) => identifier.userId)
    .map(({ identifier }) => identifier.userId as string)

  const json: BulkSubscriptionRequestBody = {
    ...(users.length > 0 && { users }),
    ...(usersByUserId.length > 0 && { usersByUserId })
  }

  try {
    const { subscription_group_type, subscription_group_id, action } = subscription
    const endpoint = getBulkSubscriptionEndpoint(settings, subscription_group_type, subscription_group_id, action)
    await request(endpoint, {
      method: 'put',
      json,
      timeout: Math.max(MIN_REQUEST_TIMEOUT, DEFAULT_REQUEST_TIMEOUT)
    })

    validPayloads.forEach(({ index, identifier }) => {
      const sent: BulkSubscriptionRequestBody = identifier.email
        ? { users: [identifier.email] }
        : { usersByUserId: [identifier.userId as string] }

      multiStatusResponse.setSuccessResponseAtIndex(index, {
        status: 200,
        sent: sent as unknown as JSONLikeObject,
        body: { success: true }
      })
    })
  } catch (error) {
    const isHTTPError = error instanceof HTTPError
    const status = isHTTPError ? error.response.status : 500
    const responseData = isHTTPError ? (error.response as ModifiedResponse).data : undefined
    const responseContent = isHTTPError ? (error.response as ModifiedResponse).content : undefined
    const errormessage =
      (responseData as { msg?: string } | undefined)?.msg ??
      (isHTTPError ? error.response.statusText : (error as Error).message)
    const body = (responseData as JSONLikeObject) ?? responseContent ?? (error as Error).message

    validPayloads.forEach(({ index, identifier }) => {
      const sent: BulkSubscriptionRequestBody = identifier.email
        ? { users: [identifier.email] }
        : { usersByUserId: [identifier.userId as string] }

      multiStatusResponse.setErrorResponseAtIndex(index, {
        status,
        errortype: 'UNKNOWN_ERROR',
        errormessage,
        sent: sent as unknown as JSONLikeObject,
        body
      })
    })
  }

  return multiStatusResponse
}

export function resolveIdentifier(payload: Payload): ResolvedIdentifier {
  const {
    identifier: { email, userId },
    user_identifier_preference
  } = payload
  const trimmedEmail = email?.trim()
  const trimmedUserId = userId?.trim()

  if (user_identifier_preference === 'userId' && trimmedUserId) {
    return { userId: trimmedUserId }
  }
  if (user_identifier_preference === 'email' && trimmedEmail) {
    return { email: trimmedEmail }
  }
  if (trimmedEmail) {
    return { email: trimmedEmail }
  }
  if (trimmedUserId) {
    return { userId: trimmedUserId }
  }
  throw new PayloadValidationError('Must include email or userId in identifier.')
}

export function getBulkSubscriptionEndpoint(
  settings: Settings,
  groupType: string,
  groupId: string,
  action: string
): string {
  const { dataCenterLocation } = settings
  const baseUrl = getRegionalBaseUrl(dataCenterLocation as DataCenterLocation)
  return `${baseUrl}/api/subscriptions/${groupType}/${groupId}?action=${action}`
}

export function getSingleUserEndpoint(
  settings: Settings,
  groupType: string,
  groupId: string,
  identifier: ResolvedIdentifier
): string {
  const { dataCenterLocation } = settings
  const baseUrl = getRegionalBaseUrl(dataCenterLocation as DataCenterLocation)
  const { email, userId } = identifier

  if (userId) {
    return `${baseUrl}/api/subscriptions/${groupType}/${groupId}/byUserId/${encodeURIComponent(userId)}`
  }
  return `${baseUrl}/api/subscriptions/${groupType}/${groupId}/user/${encodeURIComponent(email as string)}`
}
