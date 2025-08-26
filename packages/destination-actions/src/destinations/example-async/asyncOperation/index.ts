import type {
  ActionDefinition,
  AsyncActionResponseType,
  AsyncPollResponseType,
  BatchAsyncActionResponseType,
  BatchAsyncPollResponseType
} from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Async Operation Example',
  description: 'An example action that demonstrates async operations with polling',
  fields: {
    user_id: {
      label: 'User ID',
      description: 'The unique identifier for the user',
      type: 'string',
      required: true,
      default: {
        '@path': '$.userId'
      }
    },
    operation_type: {
      label: 'Operation Type',
      description: 'The type of async operation to perform',
      type: 'string',
      required: true,
      choices: ['sync_profile', 'process_data', 'generate_report']
    },
    data: {
      label: 'Operation Data',
      description: 'Additional data for the operation',
      type: 'object',
      default: {
        '@path': '$.properties'
      }
    }
  },

  perform: async (request, { settings, payload, stateContext }) => {
    // Submit the async operation to the destination
    const response = await request(`${settings.endpoint}/operations`, {
      method: 'post',
      json: {
        user_id: payload.user_id,
        operation_type: payload.operation_type,
        data: payload.data
      }
    })

    // Check if this is an async operation
    const responseData = response.data as any
    if (responseData?.status === 'accepted' && responseData?.operation_id) {
      // Store operation context in state if needed
      if (stateContext && stateContext.setResponseContext) {
        stateContext.setResponseContext('operation_id', responseData.operation_id, { hour: 24 })
        stateContext.setResponseContext('user_id', payload.user_id, { hour: 24 })
      }

      // Return async response with context for polling
      return {
        isAsync: true,
        asyncContext: {
          operation_id: responseData.operation_id,
          user_id: payload.user_id,
          operation_type: payload.operation_type
        },
        message: `Operation ${responseData.operation_id} submitted successfully`,
        status: 202
      } as AsyncActionResponseType
    }

    // Return regular response for synchronous operations
    return response
  },

  performBatch: async (request, { settings, payload, stateContext }) => {
    // Submit batch operations to the destination
    const response = await request(`${settings.endpoint}/operations/batch`, {
      method: 'post',
      json: {
        operations: payload.map((p) => ({
          user_id: p.user_id,
          operation_type: p.operation_type,
          data: p.data
        }))
      }
    })

    const responseData = response.data as any
    if (responseData?.status === 'accepted' && responseData?.operation_ids) {
      // Store batch operation context in state if needed
      if (stateContext && stateContext.setResponseContext) {
        stateContext.setResponseContext('batch_operation_ids', JSON.stringify(responseData.operation_ids), { hour: 24 })
      }

      // Return batch async response with contexts for polling
      return {
        isAsync: true,
        asyncContexts: responseData.operation_ids.map((operationId: string, index: number) => ({
          operation_id: operationId,
          user_id: payload[index]?.user_id,
          operation_type: payload[index]?.operation_type,
          batch_index: index
        })),
        message: `Batch operations submitted: ${responseData.operation_ids.join(', ')}`,
        status: 202
      } as BatchAsyncActionResponseType
    }

    // Return regular response for synchronous batch operations
    return response
  },

  poll: async (request, { settings, asyncContext }) => {
    if (!asyncContext?.operation_id) {
      const pollResponse: AsyncPollResponseType = {
        status: 'failed',
        error: {
          code: 'MISSING_CONTEXT',
          message: 'Operation ID not found in async context'
        },
        shouldContinuePolling: false
      }
      return pollResponse
    }

    // Poll the operation status
    const response = await request(`${settings.endpoint}/operations/${asyncContext.operation_id}`, {
      method: 'get'
    })

    const responseData = response.data as any
    const operationStatus = responseData?.status
    const progress = responseData?.progress || 0

    switch (operationStatus) {
      case 'pending':
      case 'processing':
        return {
          status: 'pending',
          progress,
          message: `Operation ${asyncContext.operation_id} is ${operationStatus}`,
          shouldContinuePolling: true
        } as AsyncPollResponseType

      case 'completed':
        return {
          status: 'completed',
          progress: 100,
          message: `Operation ${asyncContext.operation_id} completed successfully`,
          result: responseData?.result || {},
          shouldContinuePolling: false
        } as AsyncPollResponseType

      case 'failed':
        return {
          status: 'failed',
          error: {
            code: responseData?.error_code || 'OPERATION_FAILED',
            message: responseData?.error_message || 'Operation failed'
          },
          shouldContinuePolling: false
        } as AsyncPollResponseType

      default:
        return {
          status: 'failed',
          error: {
            code: 'UNKNOWN_STATUS',
            message: `Unknown operation status: ${operationStatus}`
          },
          shouldContinuePolling: false
        } as AsyncPollResponseType
    }
  },

  pollBatch: async (request, { settings, asyncContext }) => {
    // asyncContext should contain an array of operation contexts
    const asyncContexts = (asyncContext as any)?.asyncContexts || []

    if (!asyncContexts || asyncContexts.length === 0) {
      return {
        results: [],
        overallStatus: 'failed',
        shouldContinuePolling: false,
        message: 'No async contexts found for batch polling'
      } as BatchAsyncPollResponseType
    }

    // Poll each operation in the batch
    const results: AsyncPollResponseType[] = []

    for (const context of asyncContexts) {
      if (!context?.operation_id) {
        results.push({
          status: 'failed',
          error: {
            code: 'MISSING_CONTEXT',
            message: 'Operation ID not found in async context'
          },
          shouldContinuePolling: false
        })
        continue
      }

      try {
        // Poll individual operation status
        const response = await request(`${settings.endpoint}/operations/${context.operation_id}`, {
          method: 'get'
        })

        const responseData = response.data as any
        const operationStatus = responseData?.status
        const progress = responseData?.progress || 0

        switch (operationStatus) {
          case 'pending':
          case 'processing':
            results.push({
              status: 'pending',
              progress,
              message: `Operation ${context.operation_id} is ${operationStatus}`,
              shouldContinuePolling: true
            })
            break

          case 'completed':
            results.push({
              status: 'completed',
              progress: 100,
              message: `Operation ${context.operation_id} completed successfully`,
              result: responseData?.result || {},
              shouldContinuePolling: false
            })
            break

          case 'failed':
            results.push({
              status: 'failed',
              error: {
                code: responseData?.error_code || 'OPERATION_FAILED',
                message: responseData?.error_message || 'Operation failed'
              },
              shouldContinuePolling: false
            })
            break

          default:
            results.push({
              status: 'failed',
              error: {
                code: 'UNKNOWN_STATUS',
                message: `Unknown operation status: ${operationStatus}`
              },
              shouldContinuePolling: false
            })
        }
      } catch (error) {
        results.push({
          status: 'failed',
          error: {
            code: 'POLLING_ERROR',
            message: `Failed to poll operation ${context.operation_id}: ${error}`
          },
          shouldContinuePolling: false
        })
      }
    }

    // Determine overall status
    const completedCount = results.filter((r) => r.status === 'completed').length
    const failedCount = results.filter((r) => r.status === 'failed').length
    const pendingCount = results.filter((r) => r.status === 'pending').length

    let overallStatus: 'pending' | 'completed' | 'failed' | 'partial'
    if (completedCount === results.length) {
      overallStatus = 'completed'
    } else if (failedCount === results.length) {
      overallStatus = 'failed'
    } else if (pendingCount > 0) {
      overallStatus = 'pending'
    } else {
      overallStatus = 'partial' // Some completed, some failed
    }

    return {
      results,
      overallStatus,
      shouldContinuePolling: pendingCount > 0,
      message: `Batch status: ${completedCount} completed, ${failedCount} failed, ${pendingCount} pending`
    } as BatchAsyncPollResponseType
  }
}

export default action
