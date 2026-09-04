import type { ActionDefinition, RequestClient, ModifiedResponse } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { IntegrationError, PayloadValidationError, MultiStatusResponse } from '@segment/actions-core'
import type { Logger, StatsContext, Personas } from '@segment/actions-core/destination-kit'
import { API_VERSION } from '../versioning-info'
import { BASE_URL } from '../constants'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Upsert Profile',
  description:
    'Create or update Memora profiles. If a profile already exists, its traits are merged (new keys added, existing keys overwritten). Supports batching up to 1000 profiles.',
  defaultSubscription: 'type = "identify"',
  fields: {
    enable_batching: {
      label: 'Enable Batching',
      description: 'Enable batching of requests to Memora. Batches can contain up to 1000 profiles.',
      type: 'boolean',
      default: true,
      unsafe_hidden: true
    },
    batch_size: {
      label: 'Batch Size',
      description: 'Maximum number of profiles to include in each batch. Actual batch sizes may be lower.',
      type: 'number',
      default: 1000,
      unsafe_hidden: true
    },
    memora_store: {
      label: 'Memora Store',
      description:
        'The Memora Store ID to use for this profile. This should be a valid Memora Store associated with your Twilio account.',
      type: 'string',
      required: true,
      dynamic: true,
      disabledInputMethods: ['literal', 'variable', 'function', 'enrichment', 'freeform']
    },
    profile_identifiers: {
      label: 'Profile Identifiers',
      description:
        'Profile identifiers from all trait groups. At runtime, each event must contain at least one identifier with a non-null value, and at least two total non-null fields across identifiers and traits combined. Events with sparse data (e.g., only one identifier present) will be rejected. These fields are dynamically loaded from the selected Memora Store. When manually entering keys, use the format "TraitGroupName.$.traitName" (e.g., "Contact.$.email", "Contact.$.phone").',
      type: 'object',
      required: true,
      additionalProperties: true,
      dynamic: true,
      defaultObjectUI: 'keyvalue'
    },
    profile_traits: {
      label: 'Profile Traits',
      description:
        'Traits for the profile from all trait groups. While this field is optional in the mapping configuration, at runtime each event must have at least two total non-null fields across identifiers and traits combined. If you map only one identifier, you must also map at least one trait that will have a value for your events. These fields are dynamically loaded from the selected Memora Store. When manually entering keys, use the format "TraitGroupName.$.traitName" (e.g., "Contact.$.firstName", "PurchaseHistory.$.lastPurchaseDate").',
      type: 'object',
      required: false,
      additionalProperties: true,
      dynamic: true,
      defaultObjectUI: 'keyvalue'
    }
  },
  dynamicFields: {
    memora_store: async (request, { settings }) => {
      return fetchMemoraStores(request, settings)
    },
    profile_identifiers: {
      __keys__: async (request, { settings, payload }) => {
        if (!payload.memora_store) {
          return { choices: [], error: { message: 'Please select a Memora Store first', code: 'STORE_REQUIRED' } }
        }
        const result = await fetchTraitGroupFields(request, settings, payload.memora_store)
        return result.identifiers
      }
    },
    profile_traits: {
      __keys__: async (request, { settings, payload }) => {
        if (!payload.memora_store) {
          return { choices: [], error: { message: 'Please select a Memora Store first', code: 'STORE_REQUIRED' } }
        }
        const result = await fetchTraitGroupFields(request, settings, payload.memora_store)
        return result.traits
      }
    }
  },
  perform: async (request, { payload, settings, logger, statsContext, personasContext }) => {
    const { rawResponse, multiStatus } = await upsertProfiles(
      request,
      [payload],
      settings,
      logger,
      statsContext,
      personasContext
    )

    // For single-event execution, convert validation errors to thrown exceptions
    if (multiStatus.isErrorResponseAtIndex(0)) {
      const response = multiStatus.getResponseAtIndex(0).value()
      const error = response as { status: number; errormessage?: string }
      throw new PayloadValidationError(error.errormessage || 'Invalid profile')
    }

    // rawResponse should always be defined if we reach here (validation passed)
    if (!rawResponse) {
      throw new IntegrationError('No response returned from bulk upsert', 'MISSING_RESPONSE', 500)
    }

    return rawResponse
  },

  performBatch: async (request, { payload: payloads, settings, logger, statsContext, personasContext }) => {
    const { multiStatus } = await upsertProfiles(request, payloads, settings, logger, statsContext, personasContext)
    return multiStatus
  }
}

// Process single or batch profile upserts using bulk API
async function upsertProfiles(
  request: RequestClient,
  payloads: Payload[],
  settings: Settings,
  logger?: Logger,
  statsContext?: StatsContext,
  personasContext?: Personas
): Promise<{ rawResponse: ModifiedResponse | undefined; multiStatus: MultiStatusResponse }> {
  if (!payloads || payloads.length === 0) {
    throw new IntegrationError('No profiles provided', 'EMPTY_BATCH', 400)
  }

  const storeId = payloads[0].memora_store

  // Track valid profiles and their original indices
  const validProfiles: { traits: Record<string, Record<string, unknown>> }[] = []
  const validIdentifiers: Record<string, unknown>[] = []
  const validIndices: number[] = []
  const invalidIndices: number[] = []
  const validationErrors: Map<number, string> = new Map()

  payloads.forEach((payload, index) => {
    // Validate: at least one identifier is required and at least two total fields (identifiers + traits) must be mapped
    const identifiers = payload.profile_identifiers || {}
    const identifierCount = Object.values(identifiers).filter((v) => v !== undefined && v !== null).length
    const hasIdentifier = identifierCount > 0

    const traits = (
      payload.profile_traits && typeof payload.profile_traits === 'object' ? payload.profile_traits : {}
    ) as Record<string, unknown>
    const traitCount = Object.values(traits).filter((v) => v !== undefined && v !== null).length
    const totalFields = identifierCount + traitCount

    if (!hasIdentifier) {
      invalidIndices.push(index)
      validationErrors.set(index, 'Profile must contain at least one identifier')
      return
    }

    if (totalFields < 2) {
      invalidIndices.push(index)
      validationErrors.set(
        index,
        'Profile must contain at least two total fields (identifiers + traits). It could be two identifiers, or one identifier and one trait.'
      )
      return
    }

    // Build trait groups for valid profile
    try {
      const traitGroups = buildTraitGroups(payload)
      validProfiles.push({ traits: traitGroups })
      validIdentifiers.push(identifiers as Record<string, unknown>)
      validIndices.push(index)
    } catch (error) {
      // Catch validation errors for invalid trait key formats
      invalidIndices.push(index)
      validationErrors.set(index, error instanceof Error ? error.message : String(error))
    }
  })

  const statsTags = buildStatsTags(settings, storeId, personasContext, statsContext?.tags)
  const tagStr = statsTags.join(', ')

  if (invalidIndices.length > 0) {
    logger?.warn?.(
      `Skipped ${invalidIndices.length} invalid profile(s). Processing ${validProfiles.length} valid profile(s). ${tagStr}`
    )
  }

  // If all profiles are invalid, return MultiStatusResponse with per-profile errors
  if (validProfiles.length === 0) {
    logger?.warn?.(`No valid profiles to import. All profiles failed validation. ${tagStr}`)

    statsContext?.statsClient?.incr('memora.upsert_profile.failure', invalidIndices.length, statsTags)

    const multiStatusResponse = new MultiStatusResponse()
    invalidIndices.forEach((index) => {
      multiStatusResponse.setErrorResponseAtIndex(index, {
        status: 400,
        errormessage: validationErrors.get(index) || 'Invalid profile'
      })
    })
    return { rawResponse: undefined, multiStatus: multiStatusResponse }
  }

  // Events sharing an identifier value resolve to one profile upstream, and sending them
  // as separate entries of the same bulk request is what Memora chokes on. Collapse each
  // group into a single profile before sending. A failure here must never cost events, so
  // fall back to the previous behaviour of sending them unmerged.
  let profilesToSend = validProfiles
  let overlapStats: IdentifierOverlapStats | undefined
  try {
    const { groups, stats } = computeIdentifierGroups(validIdentifiers)
    overlapStats = stats
    profilesToSend = groups.map((positions) => ({
      traits: mergeTraitGroups(positions.map((position) => validProfiles[position].traits))
    }))
  } catch (error) {
    logger?.warn?.(
      `Failed to merge overlapping profiles, sending them unmerged: ${
        error instanceof Error ? error.message : String(error)
      }. ${tagStr}`
    )
    profilesToSend = validProfiles
  }

  // Observability must never affect delivery: a throw here would reject the whole
  // batch before the upsert is even attempted, with no status code to mark it
  // non-retryable. Nothing in this block is worth losing events over.
  if (overlapStats) {
    try {
      reportIdentifierOverlap(overlapStats, statsTags, tagStr, logger, statsContext)
    } catch (error) {
      logger?.warn?.(
        `Failed to report identifier overlap: ${error instanceof Error ? error.message : String(error)}. ${tagStr}`
      )
    }
  }

  try {
    const response = await request(`${BASE_URL}/${API_VERSION}/Stores/${storeId}/Profiles/Bulk`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Pre-Auth-Context': settings.twilioAccount
      },
      username: settings.username,
      password: settings.password,
      json: {
        profiles: profilesToSend
      }
    })

    const twilioRequestId = response.headers?.get?.('twilio-request-id')
    const mergeNote =
      profilesToSend.length === validProfiles.length
        ? ''
        : ` (${validProfiles.length} event(s) merged into ${profilesToSend.length})`
    logger?.info?.(
      `Bulk upsert completed successfully for ${profilesToSend.length} profile(s)${mergeNote}${
        twilioRequestId ? `. twilio-request-id: ${twilioRequestId}` : ''
      }. ${tagStr}`
    )

    statsContext?.statsClient?.incr('memora.upsert_profile.success', validProfiles.length, statsTags)
    if (invalidIndices.length > 0) {
      statsContext?.statsClient?.incr('memora.upsert_profile.failure', invalidIndices.length, statsTags)
    }

    const multiStatusResponse = new MultiStatusResponse()

    validIndices.forEach((index) => {
      multiStatusResponse.setSuccessResponseAtIndex(index, {
        status: response.status,
        sent: {},
        body: 'accepted'
      })
    })

    invalidIndices.forEach((index) => {
      multiStatusResponse.setErrorResponseAtIndex(index, {
        status: 400,
        errormessage: validationErrors.get(index) || 'Invalid profile'
      })
    })

    return { rawResponse: response, multiStatus: multiStatusResponse }
  } catch (error) {
    const twilioRequestId = error?.response?.headers?.get?.('twilio-request-id')
    logger?.error?.(
      `Error in bulk upsert: ${error instanceof Error ? error.message : String(error)}${
        twilioRequestId ? `. twilio-request-id: ${twilioRequestId}` : ''
      }. ${tagStr}`
    )
    statsContext?.statsClient?.incr('memora.upsert_profile.failure', payloads.length, statsTags)
    throw error
  }
}

interface IdentifierOverlapStats {
  /** Number of profiles in the request. */
  events: number
  /** Events that share no identifier value with any other event, plus one per overlapping group. */
  distinctProfiles: number
  /** Events that share at least one identifier value with another event in the request. */
  overlappingEvents: number
  /** Size of the largest group of events collapsing into a single profile. */
  largestGroupSize: number
}

/**
 * Measure how much a batch collapses upstream.
 *
 * Two events belong to the same profile if they share any identifier value, and that
 * relation is transitive: events carrying {email1, phone1}, {email1} and {phone1} all
 * resolve to one profile even though the last two share nothing directly. That makes
 * this a connected-components count over identifier values rather than a count of
 * distinct identifier tuples.
 */
interface IdentifierGrouping {
  /**
   * One entry per resolved profile, holding positions into the valid-profile arrays in
   * ascending batch order, so a later event's traits overwrite an earlier one's on merge.
   */
  groups: number[][]
  stats: IdentifierOverlapStats
}

function computeIdentifierGroups(identifierSets: Record<string, unknown>[]): IdentifierGrouping {
  const total = identifierSets.length
  const parent = Array.from({ length: total }, (_, i) => i)

  const find = (index: number): number => {
    let root = index
    while (parent[root] !== root) {
      parent[root] = parent[parent[root]] // path halving
      root = parent[root]
    }
    return root
  }

  const union = (a: number, b: number): void => {
    const rootA = find(a)
    const rootB = find(b)
    if (rootA !== rootB) {
      parent[rootB] = rootA
    }
  }

  // `identifierKey=value` -> index of the first event that carried it
  const firstSeenAt = new Map<string, number>()

  identifierSets.forEach((identifiers, index) => {
    Object.entries(identifiers).forEach(([key, value]) => {
      // Merging is destructive and irreversible, so it must require positive evidence that
      // two events are the same person. `profile_identifiers` is an `additionalProperties:
      // true` field whose values are typed `unknown` and are never type-checked -- AJV
      // constrains only the keys, and the validation above checks presence, not type -- so
      // anything the mapping produced arrives here intact.
      //
      // Only values with real identity cardinality qualify. Objects and arrays all coerce
      // to the same '[object Object]' or comma-joined token; booleans have a two-value
      // domain; 'NaN' and 'Infinity' are stable tokens shared by every event carrying them.
      // Grouping on any of those merges unrelated people into one profile. Skipping is the
      // safe failure: the event keeps its own profile, exactly as before merging existed.
      //
      // This is per VALUE, not per event -- an event with an unusable value still merges
      // through its other identifiers, and the value itself is still sent as a trait.
      const isIdentityValue =
        typeof value === 'string' || typeof value === 'bigint' || (typeof value === 'number' && Number.isFinite(value))

      if (!isIdentityValue) {
        return
      }
      const normalized = String(value).trim()
      if (normalized === '') {
        // Blank identifiers carry no identity; joining every event that has one would
        // report a single huge group that upstream never actually sees.
        return
      }
      // Length-prefixed so the key/value boundary is unambiguous. Without it, key
      // `Contact.$.a` with value `b=c` and key `Contact.$.a=b` with value `c` both
      // produce `Contact.$.a=b=c` and would union two unrelated events into one profile.
      const identity = `${key.length}:${key}=${normalized}`
      const previousIndex = firstSeenAt.get(identity)
      if (previousIndex === undefined) {
        firstSeenAt.set(identity, index)
      } else {
        union(previousIndex, index)
      }
    })
  })

  // Bucket by true root. `find` is required here: union only ever repoints roots, so a
  // node's parent may still be an absorbed intermediate. Ascending iteration keeps each
  // bucket in batch order.
  const byRoot = new Map<number, number[]>()
  for (let index = 0; index < total; index++) {
    const root = find(index)
    const members = byRoot.get(root)
    if (members) {
      members.push(index)
    } else {
      byRoot.set(root, [index])
    }
  }

  let overlappingEvents = 0
  let largestGroupSize = 0
  byRoot.forEach((members) => {
    if (members.length > 1) {
      overlappingEvents += members.length
    }
    if (members.length > largestGroupSize) {
      largestGroupSize = members.length
    }
  })

  return {
    groups: Array.from(byRoot.values()),
    stats: {
      events: total,
      distinctProfiles: byRoot.size,
      overlappingEvents,
      largestGroupSize
    }
  }
}

/**
 * Merge the trait groups of every event that resolved to the same profile.
 *
 * Merging is per trait, not per trait group, so an earlier event's traits survive unless
 * a later event sets the same trait. `perEvent` must be in ascending batch order: the
 * last writer wins, which makes the later event authoritative on conflict.
 */
function mergeTraitGroups(
  perEvent: Record<string, Record<string, unknown>>[]
): Record<string, Record<string, unknown>> {
  const merged: Record<string, Record<string, unknown>> = {}
  perEvent.forEach((traitGroups) => {
    Object.entries(traitGroups).forEach(([groupName, traits]) => {
      // Create the group as an own property first. Reading `merged[groupName]` before it
      // exists walks the prototype chain, so a polluted `Object.prototype` would have its
      // traits copied into this profile.
      if (!Object.prototype.hasOwnProperty.call(merged, groupName)) {
        merged[groupName] = {}
      }
      merged[groupName] = { ...merged[groupName], ...traits }
    })
  })
  return merged
}

// Identifier values are PII, so only counts are ever emitted — never the values themselves.
function reportIdentifierOverlap(
  stats: IdentifierOverlapStats,
  statsTags: string[],
  tagStr: string,
  logger?: Logger,
  statsContext?: StatsContext
): void {
  const statsClient = statsContext?.statsClient
  statsClient?.histogram('memora.upsert_profile.batch_overlapping_events', stats.overlappingEvents, statsTags)
  statsClient?.histogram('memora.upsert_profile.batch_largest_group', stats.largestGroupSize, statsTags)

  if (stats.overlappingEvents > 0) {
    logger?.warn?.(
      `Overlapping identifiers in batch: ${stats.events} profile(s) resolve to ${stats.distinctProfiles} distinct profile(s). ` +
        `${stats.overlappingEvents} profile(s) share an identifier value with another profile; largest group is ${stats.largestGroupSize}. ${tagStr}`
    )
  }
}

function buildStatsTags(
  settings: Settings,
  storeId: string,
  personasContext?: Personas,
  existingTags?: string[]
): string[] {
  const audienceKey = personasContext?.computation_key
  const spaceId = personasContext?.['space_id'] != null ? String(personasContext['space_id']) : undefined
  return [
    ...(existingTags ?? []),
    `twilioAccountId:${settings.twilioAccount}`,
    `memory_store_id:${storeId}`,
    ...(audienceKey ? [`audience_key:${audienceKey}`] : []),
    ...(spaceId ? [`space_id:${spaceId}`] : [])
  ]
}

// Build trait groups payload for Memora API
function buildTraitGroups(payload: Payload): Record<string, Record<string, unknown>> {
  const traitGroups: Record<string, Record<string, unknown>> = {}
  const invalidKeys: string[] = []

  // Process all traits from profile_traits field (format: TraitGroupName.$.traitName)
  if (payload.profile_traits && typeof payload.profile_traits === 'object') {
    const traits = payload.profile_traits as Record<string, unknown>
    Object.entries(traits).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        // All traits use the format traitGroupName.$.traitName
        const match = key.match(/^([^.]+)\.\$\.(.+)$/)
        if (match) {
          const traitGroupName = match[1]
          const traitName = match[2]

          // Own-property check: `traitGroups['__proto__']` and `traitGroups['constructor']`
          // resolve through the prototype chain and are truthy, so a truthiness guard here
          // would be skipped and the write below would not target an own property.
          if (!Object.prototype.hasOwnProperty.call(traitGroups, traitGroupName)) {
            traitGroups[traitGroupName] = {}
          }
          traitGroups[traitGroupName][traitName] = value
        } else {
          // Track invalid keys for error reporting
          invalidKeys.push(key)
        }
      }
    })

    // Throw error for invalid trait keys to prevent data loss
    if (invalidKeys.length > 0) {
      throw new PayloadValidationError(
        `Invalid trait key format detected. The following keys do not match the expected format: ${invalidKeys.join(
          ', '
        )}. ` +
          `Expected format: "TraitGroupName.$.traitName" (e.g., "Contact.$.firstName", "PurchaseHistory.$.lastPurchaseDate").`
      )
    }
  }

  // Merge identifiers into their respective trait groups (these are authoritative and will override any conflicting keys)
  if (payload.profile_identifiers && typeof payload.profile_identifiers === 'object') {
    const identifiers = payload.profile_identifiers as Record<string, unknown>
    const invalidIdentifierKeys: string[] = []
    Object.entries(identifiers).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        const match = key.match(/^([^.]+)\.\$\.(.+)$/)
        if (match) {
          const traitGroupName = match[1]
          const traitName = match[2]
          // Own-property check: `traitGroups['__proto__']` and `traitGroups['constructor']`
          // resolve through the prototype chain and are truthy, so a truthiness guard here
          // would be skipped and the write below would not target an own property.
          if (!Object.prototype.hasOwnProperty.call(traitGroups, traitGroupName)) {
            traitGroups[traitGroupName] = {}
          }
          traitGroups[traitGroupName][traitName] = value
        } else {
          invalidIdentifierKeys.push(key)
        }
      }
    })

    if (invalidIdentifierKeys.length > 0) {
      throw new PayloadValidationError(
        `Invalid identifier key format detected. The following keys do not match the expected format: ${invalidIdentifierKeys.join(
          ', '
        )}. ` + `Expected format: "TraitGroupName.$.traitName" (e.g., "Contact.$.email", "Contact.$.phone").`
      )
    }
  }

  return traitGroups
}

interface MemoraStoresResponse {
  stores?: string[]
  meta?: {
    pageSize?: number
    nextToken?: string
    previousToken?: string
  }
}

interface MemoraStoreDetails {
  displayName: string
  id: string
}

interface TraitDefinition {
  dataType: string
  description?: string
  displayName: string
  idTypePromotion?: string | null
}

interface TraitGroupsListResponse {
  traitGroups?: Array<{
    displayName: string
    description?: string
    traits?: Record<string, TraitDefinition>
    version?: number
  }>
  meta?: {
    pageSize?: number
    nextToken?: string
    previousToken?: string
  }
}

type DynamicFieldResult = {
  choices: Array<{ label: string; value: string; description: string }>
  error?: { message: string; code: string }
}

// Fetch all trait group fields and return identifiers and traits separately.
// Identifiers are traits with idTypePromotion set; traits are all non-identifier traits regardless of dataType.
async function fetchTraitGroupFields(
  request: RequestClient,
  settings: Settings,
  storeId: string
): Promise<{ identifiers: DynamicFieldResult; traits: DynamicFieldResult }> {
  try {
    const traitGroupsResponse = await request<TraitGroupsListResponse>(
      `${BASE_URL}/${API_VERSION}/ControlPlane/Stores/${storeId}/TraitGroups?pageSize=100&includeTraits=true`,
      {
        method: 'GET',
        headers: {
          'X-Pre-Auth-Context': settings.twilioAccount
        },
        username: settings.username,
        password: settings.password,
        skipResponseCloning: true
      }
    )

    const traitGroupObjects = traitGroupsResponse?.data?.traitGroups || []

    const identifierChoices: DynamicFieldResult['choices'] = []
    const traitChoices: DynamicFieldResult['choices'] = []

    for (const traitGroup of traitGroupObjects) {
      const traitGroupName = traitGroup.displayName
      const traits = traitGroup.traits || {}

      Object.entries(traits).forEach(([traitName, trait]) => {
        const value = `${traitGroupName}.$.${traitName}`
        const label = `${traitGroupName}.${trait.displayName || traitName}`

        if (trait.idTypePromotion) {
          const description = trait.description
            ? trait.description
            : `${traitGroupName} - ${trait.displayName} (${trait.idTypePromotion})`
          identifierChoices.push({ label, value, description })
        } else {
          const description = trait.description
            ? trait.description
            : `${traitGroupName} - ${trait.displayName} (${trait.dataType})`
          traitChoices.push({ label, value, description })
        }
      })
    }

    return {
      identifiers: { choices: identifierChoices },
      traits: { choices: traitChoices }
    }
  } catch (error) {
    const statusCode = error?.response?.status || 'unknown'
    const errorMsg = error?.response?.data?.message || (error instanceof Error ? error.message : String(error))
    const errorResult = (fieldType: string): DynamicFieldResult => ({
      choices: [],
      error: {
        message: `Unable to fetch ${fieldType} (HTTP ${statusCode}: ${errorMsg}). You can still manually enter field names.`,
        code: 'FETCH_ERROR'
      }
    })
    return {
      identifiers: errorResult('identifiers'),
      traits: errorResult('traits')
    }
  }
}

// Fetch available memora stores from Control Plane
async function fetchMemoraStores(request: RequestClient, settings: Settings) {
  try {
    // Call the Control Plane API to list memora stores
    const response = await request<MemoraStoresResponse>(
      `${BASE_URL}/${API_VERSION}/ControlPlane/Stores?pageSize=100&orderBy=ASC`,
      {
        method: 'GET',
        headers: {
          'X-Pre-Auth-Context': settings.twilioAccount
        },
        username: settings.username,
        password: settings.password,
        skipResponseCloning: true
      }
    )

    const stores = response?.data?.stores || []

    // This is not the most efficient way to get store details, but the Control Plane API does not currently provide an endpoint to list stores with their details in a single call.
    // We need to make individual calls to get store details in order to display more information in the dropdown (e.g. store name).
    // Fortunately, most accounts will have a small number of stores (max 5), so this should not be a major performance issue. If we find that this is causing performance problems, we can consider caching store details or adding an endpoint to the Control Plane API to list stores with their details.
    const memoraStores = await Promise.all(
      stores.map((storeId: string) => {
        return request<MemoraStoreDetails>(`${BASE_URL}/${API_VERSION}/ControlPlane/Stores/${storeId}`, {
          method: 'GET',
          headers: {
            'X-Pre-Auth-Context': settings.twilioAccount
          },
          username: settings.username,
          password: settings.password,
          skipResponseCloning: true
        })
      })
    )

    const choices = memoraStores.map((store) => ({
      label: store.data?.displayName || store.data?.id,
      value: store.data?.id
    }))

    return {
      choices
    }
  } catch (error) {
    // Return empty choices if the API call fails
    return {
      choices: [],
      error: {
        message: 'Unable to fetch memora stores. Please check your authentication credentials.',
        code: 'FETCH_ERROR'
      }
    }
  }
}

export default action
