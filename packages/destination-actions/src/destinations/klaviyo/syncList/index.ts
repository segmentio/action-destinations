import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { syncList, syncListBatch } from './functions'
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
  title: 'Sync List',
  description: 'Add or remove a profile from a list in Klaviyo, based on their audience membership status',
  defaultSubscription: 'type = track or type = identify',
  syncMode: {
    label: 'Sync Mode',
    description: 'Specify how Segment should sync data to Klaviyo when connected to a database Source.',
    default: 'mirror',
    choices: [
      { label: 'Add - triggers when a row is added', value: 'add' },
      { label: 'Update - triggers when a row is updated', value: 'update' },
      { label: 'Upsert - triggers when a row is added or updated', value: 'upsert' },
      { label: 'Delete - triggers when a row is deleted', value: 'delete' },
      { label: 'Mirror - triggers when a row is added, updated, or deleted', value: 'mirror' }
    ]
  },
  fields: {
    email: {
      ...email,
      default: {
        '@if': {
          exists: { '@path': '$.properties.email' },
          then: { '@path': '$.properties.email' },
          else: { '@path': '$.traits.email' }
        }
      }
    },
    phone_number: {
      ...phone_number,
      default: {
        '@if': {
          exists: { '@path': '$.properties.phone' },
          then: { '@path': '$.properties.phone' },
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
    return syncList(request, payload, audienceMembership, hookOutputs?.retlOnMappingSave?.outputs)
  },
  performBatch: async (request, { payload, audienceMembership, statsContext, hookOutputs }) => {
    return syncListBatch(
      request,
      payload,
      audienceMembership ?? [],
      statsContext,
      hookOutputs?.retlOnMappingSave?.outputs
    )
  }
}

export default action
