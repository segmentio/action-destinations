import { requireId } from '../functions'
import type { Payload } from './generated-types'
import type { SubscriptionJSON } from './types'

export function getPath(payload: Payload): 'unsubscribe' | 'resubscribe' {
  const { subscriptionAction } = payload

  return subscriptionAction as 'unsubscribe' | 'resubscribe'
}

export function buildJSON(payload: Payload): SubscriptionJSON {
  const { userId } = payload

  return { id: requireId(userId) }
}
