import type { ActionDefinition } from '@segment/actions-core'
import type { AudienceSettings, Settings } from '../generated-types'
import type { Payload, RetlOnMappingSaveInputs } from './generated-types'
import { external_id, enable_batching, batch_size } from '../properties'
import {
  contact_info,
  mobileDeviceIds,
  consent,
  batch_keys,
  phone_options,
  retlHookInputFields,
  retlHookOutputTypes
} from './fields'
import { performHook } from './hook-functions'
import { send } from './functions'
import { HookOutputs } from './types'
import { RETL_HOOK_LABEL } from './constants'

const action: ActionDefinition<Settings, Payload, AudienceSettings> = {
  title: 'Sync Audience [Beta]',
  description:
    'Add users to, and remove users from, a Display & Video 360 Customer Match audience. Supports both Contact Info and Mobile Device ID audiences. This action is currently in beta.',
  defaultSubscription: 'type = "track"',
  hooks: {
    retlOnMappingSave: {
      label: RETL_HOOK_LABEL,
      description:
        'When saving this mapping, Segment will either create a new Customer Match audience in Display & Video 360 or connect to an existing one.',
      inputFields: retlHookInputFields,
      outputTypes: retlHookOutputTypes,
      performHook: async (request, { hookInputs, features, statsContext }) => {
        return performHook(request, hookInputs as RetlOnMappingSaveInputs, features, statsContext)
      }
    }
  },
  syncMode: {
    label: 'Sync Mode',
    description:
      'When syncing from a database source (Reverse ETL), define the type of database operation that triggers ' +
      'syncs to Display & Video 360. This setting does not apply when syncing a Segment Audience; membership ' +
      'is resolved from the audience event itself and this selection is ignored.',
    default: 'mirror',
    choices: [
      { value: 'add', label: 'Add - Row added' },
      { value: 'update', label: 'Update - Row updated' },
      { value: 'upsert', label: 'Upsert - Row added or updated' },
      { value: 'delete', label: 'Delete - Row deleted' },
      { value: 'mirror', label: 'Mirror -Row added, updated or deleted' }
    ]
  },
  fields: {
    contact_info,
    mobileDeviceIds,
    phone_options,
    consent,
    external_id,
    enable_batching,
    batch_size,
    batch_keys
  },
  perform: async (request, { payload, audienceMembership, audienceSettings, hookOutputs, statsContext, features }) => {
    return send(
      request,
      [payload],
      false,
      [audienceMembership],
      audienceSettings,
      hookOutputs as HookOutputs,
      statsContext,
      features
    )
  },
  performBatch: async (
    request,
    { payload, audienceMembership, audienceSettings, hookOutputs, statsContext, features }
  ) => {
    return send(
      request,
      payload,
      true,
      audienceMembership,
      audienceSettings,
      hookOutputs as HookOutputs,
      statsContext,
      features
    )
  }
}

export default action
