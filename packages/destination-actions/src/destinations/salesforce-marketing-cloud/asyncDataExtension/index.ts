import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { keys, enable_batching, batch_size, values_dataExtensionFields, dataExtensionHook } from '../sfmc-properties'
import {
  executeAsyncInsertRowsWithMultiStatus,
  getDataExtensionFields,
  asyncInsertRowsV2,
  getExternalKey
} from '../sfmc-operations'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Event asynchronously to Data Extension',
  description: 'Insert event records asynchronously as rows into a data extension in Salesforce Marketing Cloud.',
  fields: {
    keys: { ...keys, required: true, dynamic: true },
    values: { ...values_dataExtensionFields, dynamic: true },
    enable_batching: enable_batching,
    batch_size: {
      ...batch_size,
      default: 30000,
      description: 'Maximum number of events to include in each batch for async operations. Defaults to 30000.',
      unsafe_hidden: false
    }
  },
  dynamicFields: {
    keys: {
      __keys__: async (request, { settings, payload }) => {
        const dataExtensionId =
          (payload as any).onMappingSave?.outputs?.id || (payload as any).retlOnMappingSave?.outputs?.id || ''
        return await getDataExtensionFields(request, settings.subdomain, settings, dataExtensionId, true)
      }
    },
    values: {
      __keys__: async (request, { settings, payload }) => {
        const dataExtensionId =
          (payload as any).onMappingSave?.outputs?.id || (payload as any).retlOnMappingSave?.outputs?.id || ''
        return await getDataExtensionFields(request, settings.subdomain, settings, dataExtensionId, false)
      }
    }
  },
  hooks: {
    retlOnMappingSave: {
      ...dataExtensionHook
    },
    onMappingSave: {
      ...dataExtensionHook
    }
  },
  perform: async (request, { settings, payload, hookOutputs }) => {
    const dataExtensionId: string =
      hookOutputs?.onMappingSave?.outputs?.id || hookOutputs?.retlOnMappingSave?.outputs?.id

    if (!dataExtensionId) {
      throw new IntegrationError('No Data Extension Connected', 'INVALID_CONFIGURATION', 400)
    }

    const externalKey = await getExternalKey(request, settings, dataExtensionId)
    if (!externalKey) {
      throw new IntegrationError('No External Key found for Data Extension', 'INVALID_CONFIGURATION', 400)
    }

    return asyncInsertRowsV2(request, settings.subdomain, [payload], externalKey)
  },
  performBatch: async (request, { settings, payload, hookOutputs }) => {
    const dataExtensionId: string =
      hookOutputs?.onMappingSave?.outputs?.id || hookOutputs?.retlOnMappingSave?.outputs?.id

    if (!dataExtensionId) {
      throw new IntegrationError('No Data Extension Connected', 'INVALID_CONFIGURATION', 400)
    }
    const externalKey = await getExternalKey(request, settings, dataExtensionId)
    if (!externalKey) {
      throw new IntegrationError('No External Key found for Data Extension', 'INVALID_CONFIGURATION', 400)
    }

    return executeAsyncInsertRowsWithMultiStatus(request, settings.subdomain, payload, externalKey)
  }
}

export default action
