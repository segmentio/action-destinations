import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { fields } from './fields'
import { send } from './functions'
import { companyAudienceHook } from './hooks'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Sync To LinkedIn DMP Company Segment',
  description: 'Syncs companies to LinkedIn DMP Company Segments.',
  defaultSubscription: 'type = "track"',
  fields,
  hooks: {
    retlOnMappingSave: companyAudienceHook,
    onMappingSave: companyAudienceHook
  },
  perform: async (request, { payload, hookOutputs, statsContext }) => {
    return await send(request, [payload], hookOutputs, false, statsContext)
  },
  performBatch: async (request, { payload, hookOutputs, statsContext }) => {
    return await send(request, payload, hookOutputs, true, statsContext)
  }
}

export default action
