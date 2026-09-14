import type { ActionDefinition } from '@segment/actions-core'
import type { AudienceSettings, Settings } from '../generated-types'
import type { Payload, RetlOnMappingSaveInputs } from './generated-types'
import {
  emails,
  phoneNumbers,
  zipCodes,
  firstName,
  lastName,
  countryCode,
  mobileDeviceIds,
  external_id,
  advertiser_id,
  enable_batching,
  batch_size
} from '../properties'
import { ad_user_data, ad_personalization, batch_keys, retlHookInputFields, retlHookOutputTypes } from './fields'
import { performHook } from './hook-functions'
import { send } from './functions'
import { HookOutputs } from './types'

const action: ActionDefinition<Settings, Payload, AudienceSettings> = {
  title: 'Sync Audience [Beta]',
  description:
    'Add users to, and remove users from, a Display & Video 360 Customer Match audience. Supports both Contact Info and Mobile Device ID audiences. This action is currently in beta.',
  defaultSubscription: 'type = "track"',
  hooks: {
    retlOnMappingSave: {
      label: 'Select or create an audience in Display & Video 360',
      description:
        'When saving this mapping, Segment will either create a new Customer Match audience in Display & Video 360 or connect to an existing one.',
      inputFields: retlHookInputFields,
      outputTypes: retlHookOutputTypes,
      performHook: async (request, { hookInputs, features, statsContext }) => {
        return await performHook(request, hookInputs as RetlOnMappingSaveInputs, features, statsContext)
      }
    }
  },
  syncMode: {
    label: 'Sync Mode',
    description:
      'When syncing from a database source, define the type of database operation which trigger syncs to Display & Video 360.',
    default: 'mirror',
    choices: [
      { value: 'add', label: 'Add - triggers when a row is added' },
      { value: 'update', label: 'Update - triggers when a row is updated' },
      { value: 'upsert', label: 'Upsert - triggers when a row is added or updated' },
      { value: 'delete', label: 'Delete - triggers when a row is deleted' },
      { value: 'mirror', label: 'Mirror - triggers when a row is added, updated or deleted' }
    ]
  },
  fields: {
    emails: { ...emails },
    phoneNumbers: { ...phoneNumbers },
    zipCodes: { ...zipCodes },
    firstName: { ...firstName },
    lastName: { ...lastName },
    countryCode: { ...countryCode },
    mobileDeviceIds: { ...mobileDeviceIds },
    ad_user_data: { ...ad_user_data },
    ad_personalization: { ...ad_personalization },
    external_id: { ...external_id },
    advertiser_id: { ...advertiser_id },
    enable_batching: { ...enable_batching },
    batch_size: { ...batch_size },
    batch_keys: { ...batch_keys }
  },
  perform: async (request, { payload, audienceMembership, audienceSettings, hookOutputs, statsContext, features }) => {
    statsContext?.statsClient?.incr('syncAudience.perform', 1, statsContext?.tags)
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
    statsContext?.statsClient?.incr('syncAudience.performBatch', 1, statsContext?.tags)
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
