import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { fields, retlHookInputFields, retlHookOutputTypes } from './fields'
import { send } from './functions'
import { performHook } from './hook-functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync Audience',
  description: 'Sync data to Facebook Custom Audiences.',
  hooks: {
    retlOnMappingSave: {
      label: 'Select or create an audience in Facebook',
      description:
        'When saving this mapping, Segment will either create a new audience in Facebook or connect to an existing one. To create a new audience, enter the name of the audience. To connect to an existing audience, select the audience ID from the dropdown.',
      inputFields: retlHookInputFields,
      outputTypes: retlHookOutputTypes,
      performHook: async (request, { settings, hookInputs }) => {
        const { operation, audienceName, existingAudienceId } = hookInputs
        const { retlAdAccountId: adAccountId } = settings

        return await performHook(
          request,
          adAccountId,
          operation as string,
          audienceName as string,
          existingAudienceId as string
        )
      }
    }
  },
  syncMode: {
    label: 'Sync Mode',
    description: 'Used with Reverse ETL only. Set to upsert to add audience members, or delete to remove audience members.',
    default: 'upsert',
    choices: [
      { value: 'upsert', label: 'Upsert' },
      { value: 'delete', label: 'Delete' }
    ]
  },
  fields,
  perform: async (request, { payload, hookOutputs, syncMode }) => {
    return await send(request, [payload], false, hookOutputs, syncMode)
  },
  performBatch: async (request, { payload, hookOutputs, syncMode }) => {
    return await send(request, payload, true, hookOutputs, syncMode)
  }
}

export default action