import { RequestClient, DynamicFieldResponse } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { keys, values_dataExtensionFields, dataExtensionHook } from '../sfmc-properties'
import { getDataExtensionFields } from '../sfmc-operations'

export const fields = {
  keys: { ...keys, required: true, dynamic: true },
  values: { ...values_dataExtensionFields, dynamic: true },
  enable_batching: {
    label: 'Batch data to SFMC',
    description: 'If true, data is batched before sending to the SFMC Data Extension.',
    type: 'boolean' as const,
    default: true,
    unsafe_hidden: true
  },
  batch_bytes: {
    label: 'Batch Bytes',
    description: 'The maximum size of a batch in bytes.',
    type: 'number' as const,
    required: false,
    default: 5000000, // 5 MB
    unsafe_hidden: true
  },
  batch_size: {
    label: 'Batch Size',
    description: 'Maximum number of events to include in each batch. Actual batch sizes may be lower.',
    type: 'number' as const,
    required: false,
    minimum: 1000,
    default: 28000,
    maximum: 30000,
    unsafe_hidden: true
  },
  subscription_type: {
    label: 'Subscription Type',
    description: 'The type of subscription. Flag for enabling Async Pipeline.',
    type: 'string' as const,
    choices: [
      { label: 'Sync', value: 'sync' },
      { label: 'Async', value: 'async' }
    ],
    default: 'async',
    required: false,
    unsafe_hidden: false
  }
}

export const dynamicFields = {
  keys: {
    __keys__: async (
      request: RequestClient,
      { settings, payload }: { settings: Settings; payload: Payload }
    ): Promise<DynamicFieldResponse> => {
      const dataExtensionId =
        (payload as any).onMappingSave?.outputs?.id || (payload as any).retlOnMappingSave?.outputs?.id || ''
      return await getDataExtensionFields(request, settings.subdomain, settings, dataExtensionId, true)
    }
  },
  values: {
    __keys__: async (
      request: RequestClient,
      { settings, payload }: { settings: Settings; payload: Payload }
    ): Promise<DynamicFieldResponse> => {
      const dataExtensionId =
        (payload as any).onMappingSave?.outputs?.id || (payload as any).retlOnMappingSave?.outputs?.id || ''
      return await getDataExtensionFields(request, settings.subdomain, settings, dataExtensionId, false)
    }
  }
}

export const hooks = {
  retlOnMappingSave: {
    ...dataExtensionHook
  },
  onMappingSave: {
    ...dataExtensionHook
  }
}
