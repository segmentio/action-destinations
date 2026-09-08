export const ORGANIZATION_URN_PREFIX = 'urn:li:organization:'

export const LINKEDIN_PROTOCOL_VERSION = '2.0.0'

export const SEGMENT_TYPES = {
  USER: 'USER',
  COMPANY: 'COMPANY'
} as const

export const AUDIENCE_ACTION = {
  ADD: 'ADD',
  REMOVE: 'REMOVE'
} as const

export const AUDIENCE_SOURCE = {
  ENGAGE_RETL: 'ENGAGE_RETL',
  CONNECTIONS: 'CONNECTIONS'
} as const

// 409 (conflict) is treated as retryable: it can occur when two concurrent syncs both miss the
// cache and attempt to create the same segment. Retrying resolves to the now-existing segment.
export const RETRYABLE_STATUSES: readonly number[] = [408, 409, 423, 429, 500, 502, 503, 504]
