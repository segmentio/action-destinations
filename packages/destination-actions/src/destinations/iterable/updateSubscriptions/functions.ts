import { PayloadValidationError, RequestClient, MultiStatusResponse, JSONLikeObject, HTTPError, DEFAULT_REQUEST_TIMEOUT } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { DataCenterLocation } from '../shared-fields'
import { getRegionalBaseUrl } from '../utils'
import { MAX_SUBSCRIPTION_ITEMS, VALID_ACTIONS, MIN_REQUEST_TIMEOUT } from './constants'
import type { ResolvedIdentifier, BulkSubscriptionRequestBody } from './types'

export async function performUpdateSubscriptions(request: RequestClient, payload: Payload, settings: Settings) {
  const { subscriptions } = payload
  const subscriptionCount = subscriptions.length

  if (subscriptionCount > MAX_SUBSCRIPTION_ITEMS) {
    throw new PayloadValidationError(`Maximum of ${MAX_SUBSCRIPTION_ITEMS} subscription items allowed. Received ${subscriptionCount}.`)
  }

  const identifier = resolveIdentifier(payload)

  const results = await Promise.all(
    subscriptions.map(async ({ subscription_group_type, subscription_group_id, action }) => {
      validateAction(action)
      const endpoint = getSingleUserEndpoint(settings, subscription_group_type, subscription_group_id, identifier)
      const method = action === 'subscribe' ? 'patch' : 'delete'
      return request(endpoint, { method, timeout: Math.max(MIN_REQUEST_TIMEOUT, DEFAULT_REQUEST_TIMEOUT) })
    })
  )

  return results[results.length - 1]
}

export async function performBatchUpdateSubscriptions(request: RequestClient, payloads: Payload[], settings: Settings) {
  const multiStatusResponse = new MultiStatusResponse()
  const validPayloads: { index: number; identifier: ResolvedIdentifier }[] = []

  payloads.forEach((payload, index) => {
    const sent = payload as unknown as JSONLikeObject
    const subscriptionCount = payload.subscriptions.length

    if (subscriptionCount > MAX_SUBSCRIPTION_ITEMS) {
      multiStatusResponse.setErrorResponseAtIndex(index, {
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: `Maximum of ${MAX_SUBSCRIPTION_ITEMS} subscription items allowed. Received ${subscriptionCount}.`,
        sent
      })
      return
    }

    try {
      const identifier = resolveIdentifier(payload)
      validPayloads.push({ index, identifier })
    } catch (error) {
      multiStatusResponse.setErrorResponseAtIndex(index, {
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: (error as Error).message,
        sent
      })
    }
  })

  if (validPayloads.length === 0) {
    return multiStatusResponse
  }

  const subscriptions = payloads[validPayloads[0].index].subscriptions

  const users = validPayloads.filter(({ identifier }) => identifier.email).map(({ identifier }) => identifier.email as string)
  const usersByUserId = validPayloads.filter(({ identifier }) => identifier.userId).map(({ identifier }) => identifier.userId as string)

  const body: BulkSubscriptionRequestBody = {
    ...(users.length > 0 && { users }),
    ...(usersByUserId.length > 0 && { usersByUserId })
  }

  try {
    await Promise.all(
      subscriptions.map(async ({ subscription_group_type, subscription_group_id, action }) => {
        validateAction(action)
        const endpoint = getBulkSubscriptionEndpoint(settings, subscription_group_type, subscription_group_id, action)
        return request(endpoint, {
          method: 'put',
          json: body,
          timeout: Math.max(MIN_REQUEST_TIMEOUT, DEFAULT_REQUEST_TIMEOUT)
        })
      })
    )

    validPayloads.forEach(({ index, identifier }) => {
      const sentBody: BulkSubscriptionRequestBody = identifier.email
        ? { users: [identifier.email] }
        : { usersByUserId: [identifier.userId as string] }

      multiStatusResponse.setSuccessResponseAtIndex(index, {
        status: 200,
        sent: payloads[index] as unknown as JSONLikeObject,
        body: sentBody as unknown as JSONLikeObject
      })
    })
  } catch (error) {
    const isHTTPError = error instanceof HTTPError
    const status = isHTTPError ? error.response.status : 500
    const errormessage = isHTTPError ? error.response.statusText : (error as Error).message

    validPayloads.forEach(({ index, identifier }) => {
      const sentBody: BulkSubscriptionRequestBody = identifier.email
        ? { users: [identifier.email] }
        : { usersByUserId: [identifier.userId as string] }

      multiStatusResponse.setErrorResponseAtIndex(index, {
        status,
        errortype: 'UNKNOWN_ERROR',
        errormessage,
        sent: sentBody as unknown as JSONLikeObject
      })
    })
  }

  return multiStatusResponse
}

function validateAction(action: string): void {
  if (!VALID_ACTIONS.includes(action as typeof VALID_ACTIONS[number])) {
    throw new PayloadValidationError(`Invalid action: '${action}'. Must be 'subscribe' or 'unsubscribe'.`)
  }
}

export function resolveIdentifier(payload: Payload): ResolvedIdentifier {
  const { identifier: { email, userId }, user_identifier_preference } = payload
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
