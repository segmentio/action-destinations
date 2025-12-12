import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { keys, enable_batching, batch_size, values_dataExtensionFields, dataExtensionHook } from '../sfmc-properties'
import { getDataExtensionFields, asyncUpsertRowsV2 } from '../sfmc-operations'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Event asynchronously to Data Extension',
  description: 'Upsert event records asynchronously as rows into a data extension in Salesforce Marketing Cloud.',
  fields: {
    keys: { ...keys, required: true, dynamic: true },
    values: { ...values_dataExtensionFields, dynamic: true },
    enable_batching: {
      default: true,
      unsafe_hidden: true,
      ...enable_batching
    },
    batch_bytes: {
      label: 'Batch Bytes',
      description: 'The maximum size of a batch in bytes.',
      type: 'number',
      unsafe_hidden: true,
      required: false,
      default: 6000000 // 6 MB
    },
    batch_size: {
      ...batch_size,
      minimum: 10,
      default: 30000,
      maximum: 32000,
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
      hookOutputs?.onMappingSave?.outputs?.id ||
      hookOutputs?.retlOnMappingSave?.outputs?.id ||
      '7a0270c1-25d0-f011-a5ad-d4f5ef42f423'

    if (!dataExtensionId) {
      throw new IntegrationError('No Data Extension Connected', 'INVALID_CONFIGURATION', 400)
    }
    console.log('Async Data Extension - perform - dataExtensionId:', dataExtensionId)
    return asyncUpsertRowsV2(request, settings.subdomain, [payload], dataExtensionId)
  },

  performBatch: async (request, { settings, payload, hookOutputs }) => {
    const dataExtensionId: string =
      hookOutputs?.onMappingSave?.outputs?.id ||
      hookOutputs?.retlOnMappingSave?.outputs?.id ||
      '7a0270c1-25d0-f011-a5ad-d4f5ef42f423'
    console.log('Async Data Extension - performBatch - dataExtensionId:', dataExtensionId)
    if (!dataExtensionId) {
      throw new IntegrationError('No Data Extension Connected', 'INVALID_CONFIGURATION', 400)
    }
    return asyncUpsertRowsV2(request, settings.subdomain, payload, dataExtensionId)
  }
}

export default action
