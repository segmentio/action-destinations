import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { keys, values_dataExtensionFields, dataExtensionHook } from '../sfmc-properties'
import { getDataExtensionFields, asyncUpsertRowsV2 } from '../sfmc-operations'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Event asynchronously to Data Extension',
  description: 'Upsert event records asynchronously as rows into a data extension in Salesforce Marketing Cloud.',
  fields: {
    keys: { ...keys, required: true, dynamic: true },
    values: { ...values_dataExtensionFields, dynamic: true },
    enable_batching: {
      label: 'Batch data to SFMC',
      description: 'If true, data is batched before sending to the SFMC Data Extension.',
      type: 'boolean',
      default: true,
      unsafe_hidden: true
    },
    batch_bytes: {
      label: 'Batch Bytes',
      description: 'The maximum size of a batch in bytes.',
      type: 'number',
      required: false,
      default: 5000000, // 5 MB
      unsafe_hidden: true
    },
    batch_size: {
      label: 'Batch Size',
      description: 'Maximum number of events to include in each batch. Actual batch sizes may be lower.',
      type: 'number',
      required: false,
      minimum: 1000,
      default: 28000,
      maximum: 30000,
      unsafe_hidden: true
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
