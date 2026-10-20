import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { addOrRemoveProfilesFromList, addOrRemoveProfilesFromListBatch } from './functions'
import {
  email,
  external_id,
  list_id,
  enable_batching,
  batch_size,
  first_name,
  last_name,
  organization,
  title,
  image,
  location,
  properties,
  phone_number,
  country_code
} from '../properties'
import { retlOnMappingSaveHook } from '../retlOnMappingSaveHook'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Add or Remove Profiles from List',
  description: 'Add or remove a profile from a list in Klaviyo, based on their audience membership status',
  defaultSubscription: 'type = track or type = identify',
  syncMode: {
    label: 'Sync Mode',
    description: 'Specify when Segment should sync data to Klaviyo when connected to a Revert ETL Source.',
    default: 'mirror',
    choices: [
      { label: 'Row added', value: 'add' },
      { label: 'Row updated', value: 'update' },
      { label: 'Row upserted', value: 'upsert' },
      { label: 'Row deleted', value: 'delete' },
      { label: 'Row added, updated or deleted', value: 'mirror' }
    ]
  },
  fields: {
    email: {
      ...email,
      default: {
        '@if': {
          exists: { '@path': '$.context.traits.email' },
          then: { '@path': '$.context.traits.email' },
          else: { '@path': '$.traits.email' }
        }
      }
    },
    phone_number: {
      ...phone_number,
      default: {
        '@if': {
          exists: { '@path': '$.context.traits.phone' },
          then: { '@path': '$.context.traits.phone' },
          else: { '@path': '$.traits.phone' }
        }
      }
    },
    list_id: {
      ...list_id,
      description:
        'The Klaviyo list to sync the profile to, based on their audience membership status. For Engage/Journeys audiences this is resolved automatically. For a reverse ETL (database) Source, connect this action to a list using the "Connect to a static list in Klaviyo" step when saving the mapping.',
      required: false
    },
    external_id: { ...external_id },
    enable_batching: { ...enable_batching },
    // DECISION (STRATCONN-7024): max batch size is 1000, and batches are keyed on list_id only, so a single batch
    // can mix adds and removes.
    // Adds and removes use different Klaviyo API calls with different limits:
    //   - add:    POST /profile-bulk-import-jobs/ (Bulk Import Profiles), up to 10,000 profiles per call
    //   - remove: DELETE /lists/{id}/relationships/profiles/ (Remove Profiles from List), up to 1,000 per call
    // Segment batches before performBatch runs and cannot split a batch into adds vs removes, so one limit has to
    // cover both. We settled on the lower one (1000, the remove limit); the add path could otherwise take 10,000.
    // This was agreed as a deliberate trade-off for the initial release rather than adding an integrations-go
    // override up front.
    // Monitor: Klaviyo 429s on this action. Klaviyo is a Tier 1 destination, so alerts fire if 429s spike.
    // Remediation if needed: add an integrations-go override giving a variable max batch size and splitting
    // batches into adds vs removes, the same approach as the Marketo change
    // (https://github.com/segmentio/integrations-go/pull/491).
    batch_size: { ...batch_size, default: 1000, minimum: 100, maximum: 1000 },
    first_name: { ...first_name },
    last_name: { ...last_name },
    image: { ...image },
    title: { ...title },
    organization: { ...organization },
    location: { ...location },
    properties: { ...properties },
    country_code: { ...country_code },
    batch_keys: {
      label: 'Batch Keys',
      description: 'The keys to use for batching the events.',
      type: 'string',
      unsafe_hidden: true,
      required: false,
      multiple: true,
      default: ['list_id']
    }
  },
  hooks: {
    retlOnMappingSave: retlOnMappingSaveHook<Payload>()
  },
  perform: async (request, { payload, audienceMembership, hookOutputs }) => {
    return addOrRemoveProfilesFromList(request, payload, audienceMembership, hookOutputs?.retlOnMappingSave?.outputs)
  },
  performBatch: async (request, { payload, audienceMembership, statsContext, hookOutputs }) => {
    return addOrRemoveProfilesFromListBatch(
      request,
      payload,
      audienceMembership ?? [],
      statsContext,
      hookOutputs?.retlOnMappingSave?.outputs
    )
  }
}

export default action
