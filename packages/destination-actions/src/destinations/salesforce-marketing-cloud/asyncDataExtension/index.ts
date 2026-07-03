import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import { asyncUpsertRowsV2 } from '../sfmc-operations'
import { fields, dynamicFields, hooks } from './fields'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Event asynchronously to Data Extension',
  description: `Upsert event records asynchronously as rows into a data extension in Salesforce Marketing Cloud. Note that Segment cannot provide real-time delivery confirmation or error tracking for events sent through this action- That will come in near future`,
  fields,
  dynamicFields,
  hooks,
  perform: async (request, { settings, payload, hookOutputs }) => {
    const dataExtensionId: string =
      hookOutputs?.onMappingSave?.outputs?.id || hookOutputs?.retlOnMappingSave?.outputs?.id

    if (!dataExtensionId) {
      throw new IntegrationError('No Data Extension Connected', 'INVALID_CONFIGURATION', 400)
    }

    return asyncUpsertRowsV2(request, settings.subdomain, [payload], dataExtensionId)
  },

  performBatch: async (request, { settings, payload, hookOutputs }) => {
    const dataExtensionId: string =
      hookOutputs?.onMappingSave?.outputs?.id || hookOutputs?.retlOnMappingSave?.outputs?.id

    if (!dataExtensionId) {
      throw new IntegrationError('No Data Extension Connected', 'INVALID_CONFIGURATION', 400)
    }
    return asyncUpsertRowsV2(request, settings.subdomain, payload, dataExtensionId)
  }
}

export default action
