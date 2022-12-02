import { ActionDefinition, RequestClient, RetryableError } from '@segment/actions-core'

import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { SyncAudiences } from '../api'
import { CohortChanges } from '../cohortChanges'

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
        'A user alias object. See [the docs](https://www.braze.com/docs/api/objects_filters/user_alias_object/).',
      type: 'object',
      properties: {
        alias_name: {
          label: 'Alias Name',
          type: 'string',
          required: true
        },
        alias_label: {
          label: 'Alias Label',
          type: 'string',
          required: true
        }
      }
    },
    device_id: {
      label: 'Device ID',
      description: 'The unique device Identifier',
      type: 'string'
    },
    cohort_id: {
      label: 'Cohort ID',
      description: 'The Cohort Identifier',
      type: 'string',
      required: true,
      default: {
        '@path': '$.personas.computation_id'
      }
    },
    name: {
      label: 'Cohort Name',
      description: 'The name of Cohort',
      type: 'string',
      required: true,
      default: {
        '@path': '$.personas.computation_key'
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
        'The `audience_key` of the Engage audience you want to sync to LinkedIn. This value must be a hard-coded string variable, e.g. `personas_test_audience`, in order for batching to work properly.',
      type: 'string',
      required: true
    },
    event_properties: {
      label: 'Event Properties',
      description: 'Properties of the event',
      type: 'object',
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.properties' },
          then: { '@path': '$.properties' },
          else: { '@path': '$.traits' }
        }
      }
    }
  },
  perform: async (request, { settings, payload }) => {
    return processPayload(request, settings, [payload])
  },
  performBatch: async (request, { settings, payload }) => {
    return processPayload(request, settings, payload)
  }
}
async function processPayload(request: RequestClient, settings: Settings, payloads: Payload[]) {
  settings.client_secret = 'Client_secret_key' //hard coding here as issue is in event tester.

  const SyncAudiencesApiClient: SyncAudiences = new SyncAudiences(request)

  await SyncAudiencesApiClient.createCohort(settings, payloads[0])
  const { addUsers, removeUsers } = extractUsers(payloads)
  const users = {
    addUsers,
    removeUsers,
    hasAddUsers: hasUsersToAddOrRemove(addUsers),
    hasRemoveUsers: hasUsersToAddOrRemove(removeUsers)
  }

  // We should never hit this condition because at least an user_id or device_id
  // or user_alias is required in each payload, but if we do, returning early
  // rather than hitting Cohort's API (with no data) is more efficient.
  // The monoservice will interpret this early return as a 200.

  if (!users.hasAddUsers && !users.hasRemoveUsers) {
    return
  }

  const res = await SyncAudiencesApiClient.batchUpdate(settings, payloads[0], users)

  // When User gets added or removed successfully , it will give 201 statua code other than there could be an error of invalid keys or some internal error.
  if (res.status !== 201) {
    throw new RetryableError('Error while attempting to sync audience to braze. This batch will be retried.')
  }

  return res
}

function extractUsers(payloads: Payload[]) {
  const addUsers: CohortChanges = { user_ids: [], device_ids: [], aliases: [] }
  const removeUsers: CohortChanges = { user_ids: [], device_ids: [], aliases: [], should_remove: true }

  payloads.forEach((payload: Payload) => {
    const { event_properties, external_id, device_id, user_alias } = payload
    const userEnteredOrRemoved: boolean = (
      event_properties?.audience_key
        ? event_properties[`${event_properties?.audience_key}`]
        : Object.values(event_properties)[0]
    ) as boolean
    const user = userEnteredOrRemoved ? addUsers : removeUsers

    // external_id => device_id => user_alias Priority Order
    if (external_id) {
      user.user_ids.push(external_id)
    } else if (device_id) {
      user.device_ids.push(device_id)
    } else if (user_alias) {
      user.aliases.push(user_alias)
    }
  })

  return {
    addUsers,
    removeUsers
  }
}

function hasUsersToAddOrRemove(user: CohortChanges): boolean {
  if (
    user &&
    typeof user === 'object' &&
    (user?.user_ids?.length || user?.device_ids?.length || user?.aliases?.length)
  ) {
    return true
  }
  return false
}

export default action
