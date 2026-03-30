import { InputData } from './mapping-kit'
import { SyncMode, AudienceMembership } from './destination-kit/types'

/**
 * Resolves whether a user is being added to or removed from an audience.
 * Returns `true` if the user is being added, `false` if being removed,
 * or `undefined` if the payload is not an audience computation or membership cannot be determined.
 */
export function resolveAudienceMembership(rawData: InputData | undefined, syncMode?: SyncMode): AudienceMembership {
  if (!rawData) return undefined

  const engageMembership = engageAudienceMembership(rawData)

  if (typeof engageMembership === 'boolean') {
    return engageMembership
  }

  const retlMembership = retlAudienceMembership(rawData, syncMode)

  if (typeof retlMembership === 'boolean') {
    return retlMembership
  }

  return undefined
}
/**
 * Resolves whether a user is being added to or removed from an audience based on Engage data.
 * Returns `true` if the user is being added, `false` if being removed,
 * or `undefined` if the payload is not an audience computation or membership cannot be determined.
 */
export function engageAudienceMembership(rawData: InputData | undefined): AudienceMembership {
  if (!rawData) return undefined

  const {
    context: { personas: { computation_class = '', computation_key = '' } = {} } = {},
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

  let membershipValue: boolean | undefined

  if (type === 'identify' && typeof traits?.[computation_key] === 'boolean') {
    membershipValue = traits[computation_key]
  } else if (type === 'track' && typeof properties?.[computation_key] === 'boolean') {
    membershipValue = properties[computation_key]
  }

  return typeof membershipValue === 'boolean' ? membershipValue : undefined
}

/**
 * Resolves whether a user is being added to or removed from an audience based on RETL data.
 * Returns `true` if the user is being added, `false` if being removed,
 * or `undefined` if the payload is not an audience computation or membership cannot be determined.
 */
export function retlAudienceMembership(rawData: InputData | undefined, syncMode?: SyncMode): AudienceMembership {
  if (!rawData || !syncMode) return undefined

  const { event = '', type = '' } = rawData as {
    event?: string
    type?: string
  }

  if (type !== 'track') return undefined

  if (
    (syncMode === 'add' && ['new'].includes(event)) ||
    (syncMode === 'update' && ['updated'].includes(event)) ||
    (syncMode === 'upsert' && ['new', 'updated'].includes(event)) ||
    (syncMode === 'mirror' && ['new', 'updated'].includes(event))
  ) {
    return true
  } else if (
    (syncMode === 'delete' && ['deleted'].includes(event)) ||
    (syncMode === 'mirror' && ['deleted'].includes(event))
  ) {
    return false
  }

  return undefined
}
