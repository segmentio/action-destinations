import { PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { DataCenterLocation } from '../shared-fields'
import type { ResolvedIdentifier } from './types'

export function resolveIdentifier(payload: Payload): ResolvedIdentifier {
  const { identifier, user_identifier_preference } = payload

  if (user_identifier_preference === 'userId' && identifier.userId) {
    return { userId: identifier.userId }
  }
  if (user_identifier_preference === 'email' && identifier.email) {
    return { email: identifier.email }
  }
  if (identifier.email) {
    return { email: identifier.email }
  }
  if (identifier.userId) {
    return { userId: identifier.userId }
  }
  throw new PayloadValidationError('Must include email or userId in identifier.')
}

export function getSubscriptionEndpoint(
  settings: Settings,
  groupType: string,
  groupId: string,
  action: string
): string {
  const dataCenterLocation = (settings.dataCenterLocation as DataCenterLocation) || 'united_states'
  const regionBaseUrls: Record<string, string> = {
    united_states: 'https://api.iterable.com',
    europe: 'https://api.eu.iterable.com'
  }
  const baseUrl = regionBaseUrls[dataCenterLocation] || regionBaseUrls['united_states']
  return `${baseUrl}/api/subscriptions/${groupType}/${groupId}?action=${action}`
}

export function getSingleUserEndpoint(
  settings: Settings,
  groupType: string,
  groupId: string,
  identifier: ResolvedIdentifier
): string {
  const dataCenterLocation = (settings.dataCenterLocation as DataCenterLocation) || 'united_states'
  const regionBaseUrls: Record<string, string> = {
    united_states: 'https://api.iterable.com',
    europe: 'https://api.eu.iterable.com'
  }
  const baseUrl = regionBaseUrls[dataCenterLocation] || regionBaseUrls['united_states']

  if (identifier.userId) {
    return `${baseUrl}/api/subscriptions/${groupType}/${groupId}/byUserId/${encodeURIComponent(identifier.userId)}`
  }
  return `${baseUrl}/api/subscriptions/${groupType}/${groupId}/user/${encodeURIComponent(identifier.email!)}`
}
