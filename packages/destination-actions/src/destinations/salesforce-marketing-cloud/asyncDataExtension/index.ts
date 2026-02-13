import { ActionDefinition, IntegrationError, JSONLikeObject } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { keys, values_dataExtensionFields, dataExtensionHook } from '../sfmc-properties'
import { getDataExtensionFields, asyncUpsertRowsV2, pollAsyncOperation } from '../sfmc-operations'

// Define the minimal payload type for polling operations
interface PollPayload {
  operationId: string
}

const action: ActionDefinition<Settings, Payload, unknown, unknown, unknown, PollPayload> = {
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
  pollFields: {
    operationId: {
      label: 'Operation ID',
      description: 'The ID of the asynchronous operation to poll.',
      type: 'string',
      required: true
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
  },

  pollStatus: async (request, { settings, payload }) => {
    // Get the operation ID from the payload
    const operationId = payload.operationId

    if (!operationId) {
      throw new IntegrationError('Operation ID is required for polling.', 'INVALID_REQUEST', 400)
    }

    // Poll the SFMC async operation status
    const pollResult = await pollAsyncOperation(request, settings.subdomain, operationId)

    // Map SFMC status to framework status
    let status: 'pending' | 'completed' | 'failed'
    switch (pollResult.status) {
      case 'Complete':
        status = 'completed'
        break
      case 'Failed':
      case 'Error':
        status = 'failed'
        break
      case 'InProcess':
      case 'Queued':
      default:
        status = 'pending'
        break
    }

    const results = pollResult.results || {}
    const context: JSONLikeObject = {
      operationId: pollResult.operationId,
      completedAt: pollResult.completedAt
    }

    return {
      results: [
        {
          status: status,
          message: pollResult.errorMessage || `Operation ${operationId} is ${pollResult.status}`,
          result: results as JSONLikeObject,
          context: context
        }
      ],
      overallStatus: status,
      message: pollResult.errorMessage || `Async operation ${status}`
    }
  }
}

export default action
