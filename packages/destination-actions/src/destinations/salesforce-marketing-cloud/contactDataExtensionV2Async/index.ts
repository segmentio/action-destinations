import { IntegrationError, ActionDefinition, JSONLikeObject } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { keys, enable_batching, batch_size, values_contactFields, dataExtensionHook } from '../sfmc-properties'
import { getDataExtensionFields, insertRowsAsync, pollAsyncOperation } from '../sfmc-operations'

// Define the minimal payload type for polling operations
interface PollPayload {
  operationId: string
}

const action: ActionDefinition<Settings, Payload, unknown, unknown, unknown, PollPayload> = {
  title: 'Send Contact to Data Extension (V2 Async)',
  defaultSubscription: 'type = "identify"',
  description:
    'Asynchronously upsert contact data as rows into an existing data extension in Salesforce Marketing Cloud using the async API.',
  fields: {
    keys: {
      ...keys,
      dynamic: true,
      properties: {
        contactKey: {
          label: 'Contact Key',
          description:
            'The unique identifier that you assign to a contact. Contact Key must be a Primary Key in the data extension that contains contact information.',
          type: 'string',
          required: true
        }
      },
      default: {
        contactKey: { '@path': '$.userId' }
      }
    },
    values: { ...values_contactFields, dynamic: true },
    enable_batching: {
      ...enable_batching,
      default: true,
      unsafe_hidden: true
    },
    batch_size: {
      ...batch_size,
      default: 10000,
      unsafe_hidden: true
    }
  },
  dynamicFields: {
    keys: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      __keys__: async (request: any, { settings, payload }: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
        const dataExtensionId = payload.onMappingSave?.outputs?.id || payload.retlOnMappingSave?.outputs?.id || ''
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
        return await getDataExtensionFields(request, settings.subdomain, settings, dataExtensionId, true)
      }
    },
    values: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      __keys__: async (request: any, { settings, payload }: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
        const dataExtensionId = payload.onMappingSave?.outputs?.id || payload.retlOnMappingSave?.outputs?.id || ''
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
        return await getDataExtensionFields(request, settings.subdomain, settings, dataExtensionId, false)
      }
    }
  },
  pollFields: {
    operationId: {
      label: 'Operation ID',
      description: 'The unique identifier for the async operation to poll',
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

  // This perform method is required but won't be used since this action only supports batch operations
  perform: async () => {
    throw new IntegrationError(
      'This action only supports batch operations. Use performBatch instead.',
      'INVALID_REQUEST',
      400
    )
  },

  performBatch: async (request, { settings, payload, hookOutputs, stateContext }) => {
    console.log('async called')
    const dataExtensionId: string =
      hookOutputs?.onMappingSave?.outputs?.id || hookOutputs?.retlOnMappingSave?.outputs?.id

    console.log('async perform batch called', dataExtensionId)

    if (!dataExtensionId) {
      throw new IntegrationError('Data Extension ID is required', 'INVALID_CONFIGURATION', 400)
    }

    // Start the async operation and get the HTTP response
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const response = await insertRowsAsync(request, settings.subdomain, payload, dataExtensionId)

    // Generate a unique operation ID for tracking
    // In a real implementation, this would come from the SFMC API response
    const operationId = `sfmc-async-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    if (stateContext) {
      stateContext.setResponseContext('operationId', String(operationId), {})
      stateContext.setResponseContext('dataExtensionId', dataExtensionId, {})
    }

    // Return the HTTP response as before
    return response
  },

  poll: async (request, { payload, settings }) => {
    console.log('async poll called')
    // Get the operation ID from the payload
    const operationId = payload.operationId

    if (!operationId) {
      throw new IntegrationError('Operation ID not found in payload', 'INVALID_REQUEST', 400)
    }

    // Poll the SFMC async operation status
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
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
