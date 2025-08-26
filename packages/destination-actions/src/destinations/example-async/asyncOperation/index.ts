import type { ActionDefinition, AsyncActionResponseType, AsyncPollResponseType } from '@segment/actions-core'
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

  perform: async (request, { settings, payload }) => {
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
  }
}

export default action
