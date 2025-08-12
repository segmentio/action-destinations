/**
 * Example of implementing an async action destination
 *
 * This example demonstrates how to create a destination that supports async operations
 * where performBatch initiates an async operation and poll checks the status.
 */

import { ActionDefinition } from '../action'
import { AsyncOperationResponse, PollResponse, PollInput } from '../types'
import { RequestClient } from '../../create-request-client'

// Example destination settings
interface ExampleSettings {
  apiKey: string
  endpoint: string
  timeout?: number
}

// Example payload structure
interface ExamplePayload {
  userId: string
  email: string
  properties: Record<string, unknown>
  timestamp?: string
}

/**
 * Example async action that demonstrates the async pattern:
 * 1. performBatch initiates an async operation and returns operation details
 * 2. poll method can be called later to check the status of the operation
 */
const exampleAsyncAction: ActionDefinition<ExampleSettings, ExamplePayload> = {
  title: 'Send User Data (Async)',
  description: 'Send user data to the external service using async processing',

  fields: {
    userId: {
      label: 'User ID',
      description: 'The unique identifier for the user',
      type: 'string',
      required: true
    },
    email: {
      label: 'Email Address',
      description: "The user's email address",
      type: 'string',
      required: true,
      format: 'email'
    },
    properties: {
      label: 'User Properties',
      description: 'Additional properties to send with the user data',
      type: 'object',
      required: false,
      default: {}
    },
    timestamp: {
      label: 'Timestamp',
      description: 'The timestamp when this event occurred',
      type: 'datetime',
      required: false
    }
  },

  /**
   * Single event processing (synchronous)
   * This is used for individual events and testing
   */
  perform: async (request, { payload, settings }) => {
    const response = await request(`${settings.endpoint}/users`, {
      method: 'POST',
      json: {
        userId: payload.userId,
        email: payload.email,
        properties: payload.properties,
        timestamp: payload.timestamp || new Date().toISOString()
      }
    })

    return response
  },

  /**
   * Batch processing (asynchronous)
   * This initiates an async operation and returns operation details
   */
  performBatch: async (request, { payload, settings }) => {
    // Prepare batch data
    const batchData = payload.map((item) => ({
      userId: item.userId,
      email: item.email,
      properties: item.properties,
      timestamp: item.timestamp || new Date().toISOString()
    }))

    // Initiate async batch operation
    const response = await request(`${settings.endpoint}/batch/async`, {
      method: 'POST',
      json: {
        data: batchData,
        callback_url: `${settings.endpoint}/webhooks/batch-complete` // Optional
      },
      timeout: settings.timeout || 30000
    })

    // Extract operation details from response
    const responseData = response.data as {
      operationId: string
      estimatedDuration?: string
    }

    // Return async operation response
    const asyncResponse: AsyncOperationResponse = {
      operationId: responseData.operationId,
      status: 'pending',
      message: `Batch operation initiated for ${payload.length} records (estimated duration: ${
        responseData.estimatedDuration || '5-10 minutes'
      })`
    }

    return asyncResponse
  },

  /**
   * Poll method to check the status of an async operation
   * This method is called periodically to check if the operation is complete
   */
  poll: async (request: RequestClient, data: PollInput<ExampleSettings>) => {
    const response = await request(`${data.settings.endpoint}/batch/status/${data.operationId}`, {
      method: 'GET',
      timeout: data.settings.timeout || 10000
    })

    const statusData = response.data as {
      status: string
      processedRecords?: number
      failedRecords?: number
      successRate?: number
      completedAt?: string
      errorMessage?: string
      errorCode?: string
      progress?: number
      estimatedTimeRemaining?: string
    }

    // Handle different operation statuses
    switch (statusData.status) {
      case 'completed':
        return {
          status: 'completed' as const,
          message: 'Batch operation completed successfully',
          result: {
            processedRecords: statusData.processedRecords,
            failedRecords: statusData.failedRecords,
            successRate: statusData.successRate,
            completedAt: statusData.completedAt
          }
        } as PollResponse

      case 'failed':
        return {
          status: 'failed' as const,
          message: 'Batch operation failed',
          error: {
            message: statusData.errorMessage || 'Unknown error occurred',
            code: statusData.errorCode || 'BATCH_FAILED'
          }
        } as PollResponse

      case 'processing':
      case 'pending':
      default:
        return {
          status: 'pending' as const,
          message: `Batch operation in progress: ${statusData.progress || 0}% complete`,
          result: {
            progress: statusData.progress,
            estimatedTimeRemaining: statusData.estimatedTimeRemaining
          }
        } as PollResponse
    }
  }
}

export default exampleAsyncAction

/**
 * Usage example in a destination:
 *
 * import { DestinationDefinition } from '@segment/actions-core'
 * import exampleAsyncAction from './exampleAsyncAction'
 *
 * const destination: DestinationDefinition<ExampleSettings> = {
 *   name: 'Example Async Destination',
 *   slug: 'example-async',
 *   mode: 'cloud',
 *
 *   authentication: {
 *     scheme: 'custom',
 *     fields: {
 *       apiKey: {
 *         label: 'API Key',
 *         description: 'Your API key for authentication',
 *         type: 'password',
 *         required: true
 *       },
 *       endpoint: {
 *         label: 'API Endpoint',
 *         description: 'The base URL for your API',
 *         type: 'string',
 *         required: true,
 *         default: 'https://api.example.com'
 *       }
 *     }
 *   },
 *
 *   actions: {
 *     sendUserData: exampleAsyncAction
 *   }
 * }
 *
 * export default destination
 *
 *
 * How the async flow works:
 *
 * 1. When a batch of events is processed, performBatch is called
 * 2. performBatch initiates an async operation with the external service
 * 3. The external service returns an operation ID and status
 * 4. performBatch returns an AsyncOperationResponse with operation details
 * 5. The system returns a 202 Accepted status to indicate async processing
 * 6. Later, the poll method is called periodically with the operation ID
 * 7. poll checks the status of the operation and returns current state
 * 8. This continues until the operation is 'completed' or 'failed'
 *
 * Benefits of async actions:
 * - Handle large batches without timeouts
 * - Don't block other operations while processing
 * - Provide progress updates during long-running operations
 * - Allow for more efficient resource utilization
 * - Better error handling for complex operations
 */
