import { InputData } from './mapping-kit'

/**
 * Resolves whether a user is being added to or removed from an audience.
 * Returns `true` if the user is being added, `false` if being removed,
 * or `undefined` if the payload is not an audience computation or membership cannot be determined.
 */
export function resolveAudienceMembership(rawData: InputData | undefined): boolean | undefined {
  if (!rawData) return undefined

  const membership = engageMembership(rawData)

  if (typeof membership === 'boolean') {
    return membership
  }

  return undefined
}

export function engageMembership(rawData: InputData | undefined): boolean | undefined {
  if (!rawData) return undefined

  const {
    context: {
      personas: {
        computation_class = '',
        computation_key = ''
      } = {}
    } = {},
    properties = {},
    traits = {},
    type = ''
  } = rawData as {
    context?: { personas?: { computation_class?: string; computation_key?: string } }
    properties?: Record<string, unknown>
    traits?: Record<string, unknown>
    type?: string
  }

  if (!['audience', 'journey_step'].includes(computation_class)) return undefined
  if (!computation_key) return undefined

  let membershipValue: unknown

  if (type === 'identify') {
    membershipValue = traits?.[computation_key]
  } else if (type === 'track') {
    membershipValue = properties?.[computation_key]
  }

  return typeof membershipValue === 'boolean' ? membershipValue : undefined
}
