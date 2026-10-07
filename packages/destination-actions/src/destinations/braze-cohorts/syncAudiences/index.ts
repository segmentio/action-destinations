import {
  ActionDefinition,
  RequestClient,
  PayloadValidationError,
  MultiStatusResponse,
  JSONLikeObject,
  ErrorCodes
} from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { SyncAudiences } from '../api'
import { CohortChanges, UserAlias } from '../braze-cohorts-types'
import { StateContext, StatsContext } from '@segment/actions-core/destination-kit'
import isEmpty from 'lodash/isEmpty'

const UNIDENTIFIABLE_USER_ERROR =
  'User Alias Object requires both Alias Name and Alias Label when External User ID and Device ID are not set.'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync Audience',
  description: 'Record custom events in Braze',
  defaultSubscription: 'event = "Audience Entered" or event = "Audience Exited"',
  fields: {
    external_id: {
      label: 'External User ID',
      description:
        'The external_id serves as a unique user identifier for whom you are submitting data. This identifier should be the same as the one you set in the Braze SDK in order to avoid creating multiple profiles for the same user.',
      type: 'string',
      default: {
        '@path': '$.userId'
      }
    },
    user_alias: {
      label: 'User Alias Object',
      description:
        'Alternate unique user identifier, this is required if External User ID or Device ID is not set. Both `Alias Name` and `Alias Label` must be provided together; if either is missing the alias is ignored in favor of External User ID or Device ID. Refer [Braze Documentation](https://www.braze.com/docs/api/objects_filters/user_alias_object) for more details.',
      type: 'object',
      properties: {
        alias_name: {
          label: 'Alias Name',
          type: 'string'
        },
        alias_label: {
          label: 'Alias Label',
          type: 'string'
        }
      }
    },
    device_id: {
      label: 'Device ID',
      description:
        'Device IDs can be used to add and remove only anonymous users to/from a cohort. However, users with an assigned User ID cannot use Device ID to sync to a cohort.',
      type: 'string'
    },
    cohort_id: {
      label: 'Cohort ID',
      description: 'The Cohort Identifier',
      type: 'string',
      unsafe_hidden: true,
      required: true,
      default: {
        '@path': '$.context.personas.computation_id'
      }
    },
    cohort_name: {
      label: 'Cohort Name',
      description: 'The name of Cohort',
      type: 'string',
      unsafe_hidden: true,
      required: true,
      default: {
        '@path': '$.context.personas.computation_key'
      }
    },
    enable_batching: {
      label: 'Enable Batching',
      description: 'Enable batching of requests to the Braze cohorts.',
      type: 'boolean',
      default: true
    },
    personas_audience_key: {
      label: 'Segment Engage Audience Key',
      description:
        'The `audience_key` of the Engage audience you want to sync to Braze Cohorts. This value must be a hard-coded string variable, e.g. `personas_test_audience`, in order for batching to work properly.',
      type: 'string',
      required: true
    },
    event_properties: {
      label: 'Event Properties',
      description:
        'Displays properties of the event to add/remove users to a cohort and the traits of the specific user',
      type: 'object',
      required: true,
      unsafe_hidden: true,
      default: {
        '@if': {
          exists: { '@path': '$.properties' },
          then: { '@path': '$.properties' },
          else: { '@path': '$.traits' }
        }
      }
    },
    time: {
      label: 'Time',
      description: 'When the event occurred.',
      type: 'string',
      unsafe_hidden: true,
      required: true,
      default: {
        '@path': '$.timestamp'
      }
    },
    batch_keys: {
      label: 'Batch Keys',
      description: 'The keys to use for batching the events.',
      type: 'string',
      unsafe_hidden: true,
      default: ['cohort_name', 'cohort_id'],
      multiple: true,
      required: false
    }
  },
  perform: async (request, { settings, payload, stateContext, statsContext }) => {
    return processPayload(request, settings, [payload], stateContext, false, statsContext)
  },
  performBatch: async (request, { settings, payload, stateContext, statsContext }) => {
    return processPayload(request, settings, payload, stateContext, true, statsContext)
  }
}
async function processPayload(
  request: RequestClient,
  settings: Settings,
  payloads: Payload[],
  stateContext: StateContext | undefined,
  isBatch: boolean,
  statsContext?: StatsContext
) {
  // Batch-wide invariant: cohort_name and personas_audience_key are configuration values
  // that are identical for every event in the batch, so a mismatch is a whole-batch failure.
  validate(payloads)

  const multiStatusResponse = new MultiStatusResponse()

  // Classify each payload:
  //  - 'sync'   : has a usable identifier (External User ID, Device ID, or a complete User
  //               Alias Object) and is sent to Braze.
  //  - 'reject' : a User Alias Object was provided but is incomplete (missing alias_name or
  //               alias_label) and there is no External User ID / Device ID to fall back on,
  //               so the user cannot be identified. In a batch we fail ONLY this index; for a
  //               single event we throw (preserving the previous perform() behavior).
  //  - 'noop'   : no identifier at all. Historically a no-op that succeeds without syncing a
  //               user, so we preserve that (200 in a batch, early return for a single event).
  const payloadsToSync: Payload[] = []
  const succeededIndices: number[] = []
  let noopCount = 0

  payloads.forEach((payload, index) => {
    switch (classifyPayload(payload)) {
      case 'sync':
        payloadsToSync.push(payload)
        succeededIndices.push(index)
        break
      case 'noop':
        noopCount++
        succeededIndices.push(index)
        break
      case 'reject':
        if (!isBatch) {
          throw new PayloadValidationError(UNIDENTIFIABLE_USER_ERROR)
        }
        multiStatusResponse.setErrorResponseAtIndex(index, {
          status: 400,
          errortype: ErrorCodes.PAYLOAD_VALIDATION_FAILED,
          errormessage: UNIDENTIFIABLE_USER_ERROR,
          body: payload as unknown as JSONLikeObject
        })
        break
    }
  })

  // Events with no identifier at all are silently accepted without syncing a user; emit a
  // counter so the volume of these no-ops can be analysed later.
  if (noopCount > 0) {
    statsContext?.statsClient?.incr('syncAudiences.noop', noopCount, [
      ...(statsContext.tags ?? []),
      'reason:no_identifier',
      `is_batch:${isBatch}`
    ])
  }

  const syncAudiencesApiClient: SyncAudiences = new SyncAudiences(request, settings)
  const { cohort_name, cohort_id } = payloads[0]
  const cohortChanges: Array<CohortChanges> = []

  if (stateContext?.getRequestContext?.('cohort_name') != cohort_name) {
    await syncAudiencesApiClient.createCohort(settings, payloads[0])
    //setting cohort_name in cache context with ttl 0 so that it can keep the value as long as possible.
    stateContext?.setResponseContext?.(`cohort_name`, cohort_name, {})
  }
  const { addUsers, removeUsers } = extractUsers(payloadsToSync)

  const hasAddUsers = hasUsersToAddOrRemove(addUsers)
  const hasRemoveUsers = hasUsersToAddOrRemove(removeUsers)

  if (hasAddUsers) {
    cohortChanges.push(addUsers)
  }
  if (hasRemoveUsers) {
    cohortChanges.push(removeUsers)
  }

  // The whole batch is delivered to Braze in a single request. If that request fails it
  // throws here and propagates, failing the batch as a whole — which is correct, because
  // every synced event shared that one request (and 5xx failures stay retryable).
  const response =
    cohortChanges.length > 0 ? await syncAudiencesApiClient.batchUpdate(settings, cohort_id, cohortChanges) : undefined

  // Single-event path keeps its original contract: return the API response (or undefined
  // when there was nothing to send).
  if (!isBatch) {
    return response
  }

  // The aggregated request succeeded (or there was nothing to send): mark every synced and
  // no-op event as accepted. Rejected indices already hold their per-event 400.
  for (const index of succeededIndices) {
    multiStatusResponse.setSuccessResponseAtIndex(index, {
      status: 200,
      sent: payloads[index] as unknown as JSONLikeObject,
      body: (response?.data ?? {}) as JSONLikeObject
    })
  }

  return multiStatusResponse
}

function validate(payloads: Payload[]): void {
  if (payloads[0].cohort_name !== payloads[0].personas_audience_key) {
    throw new PayloadValidationError('The value of `personas computation key` and `personas_audience_key` must match.')
  }
}

// Braze rejects an alias object unless both alias_name and alias_label are present.
function hasCompleteAlias(user_alias: Payload['user_alias']): user_alias is UserAlias {
  return Boolean(user_alias?.alias_name && user_alias?.alias_label)
}

function classifyPayload({ external_id, device_id, user_alias }: Payload): 'sync' | 'reject' | 'noop' {
  if (external_id || device_id || hasCompleteAlias(user_alias)) {
    return 'sync'
  }
  // No External User ID / Device ID and no complete alias. If an alias object was supplied
  // but is incomplete, it is a rejectable misconfiguration; otherwise the event simply has
  // no identifier and is a no-op.
  return user_alias ? 'reject' : 'noop'
}

function extractUsers(payloads: Payload[]) {
  // sort by time in descending order
  // This is important because if a user is added and removed in the same batch,
  // we want to ensure that the last action is taken.
  payloads = payloads.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
  const addUsers = { user_ids: new Set(), device_ids: new Set(), aliases: new Map() }
  const removeUsers = {
    user_ids: new Set(),
    device_ids: new Set(),
    aliases: new Map(),
    should_remove: true
  }

  payloads.forEach((payload: Payload) => {
    const { event_properties, external_id, device_id, user_alias, personas_audience_key } = payload
    const userEnteredOrRemoved: boolean = event_properties[`${personas_audience_key}`] as boolean
    const user = userEnteredOrRemoved ? addUsers : removeUsers

    // If the user is already in the cohort, we don't need to add them again.
    if (external_id && !addUsers.user_ids?.has(external_id) && !removeUsers.user_ids?.has(external_id)) {
      user?.user_ids?.add(external_id)
    } else if (device_id && !addUsers.device_ids?.has(device_id) && !removeUsers.device_ids?.has(device_id)) {
      user?.device_ids?.add(device_id)
    } else if (user_alias && hasCompleteAlias(user_alias)) {
      const aliasKey = `${user_alias.alias_name}:${user_alias.alias_label}`
      if (!addUsers.aliases?.has(aliasKey) && !removeUsers.aliases?.has(aliasKey)) {
        user?.aliases?.set(aliasKey, user_alias)
      }
    }
  })

  return {
    addUsers: {
      user_ids: toMayBeArray(addUsers.user_ids),
      device_ids: toMayBeArray(addUsers.device_ids),
      aliases: transformAliases(addUsers.aliases)
    } as CohortChanges,
    removeUsers: {
      user_ids: toMayBeArray(removeUsers.user_ids),
      device_ids: toMayBeArray(removeUsers.device_ids),
      aliases: transformAliases(removeUsers.aliases),
      should_remove: removeUsers.should_remove
    } as CohortChanges
  }
}

function transformAliases(aliases: Map<string, UserAlias> | undefined): UserAlias[] | undefined {
  if (!aliases) return undefined
  return Array.from(aliases.values()).map((alias) => ({
    alias_name: alias.alias_name,
    alias_label: alias.alias_label
  }))
}

function toMayBeArray<T>(set: Set<T> | undefined): T[] | undefined {
  return set ? Array.from(set) : undefined
}

function hasUsersToAddOrRemove(user: CohortChanges): boolean {
  return !(isEmpty(user?.user_ids) && isEmpty(user?.device_ids) && isEmpty(user?.aliases))
}

export default action
