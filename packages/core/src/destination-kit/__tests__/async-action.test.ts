import { Action } from '../action'
import { AsyncOperationResponse, PollResponse } from '../types'
import { InputData } from '../../mapping-kit'

// Mock settings type for testing
interface TestSettings {
  apiKey: string
  endpoint: string
}

describe('Async Actions', () => {
  const mockSettings: TestSettings = {
    apiKey: 'test-key',
    endpoint: 'https://api.example.com'
  }

  const mockPayloads: InputData[] = [
    {
      userId: 'user1',
      email: 'user1@example.com',
      name: 'User 1'
    },
    {
      userId: 'user2',
      email: 'user2@example.com',
      name: 'User 2'
    }
  ]

  it('should support async operations with performBatch returning AsyncOperationResponse', async () => {
    const asyncActionDefinition = {
      title: 'Test Async Action',
      description: 'Test action that supports async operations',
      fields: {
        userId: {
          label: 'User ID',
          description: 'The user ID',
          type: 'string' as const,
          required: true
        },
        email: {
          label: 'Email',
          description: 'The user email',
          type: 'string' as const,
          required: true
        }
      },
      perform: jest.fn(),
      performBatch: jest.fn().mockImplementation(async (_request, data) => {
        // Simulate async operation initiation and store context in stateContext
        const operationId = `op_${Date.now()}`

        // Store context data in stateContext for poll method to access
        const contextData = {
          batchSize: data.payload.length,
          createdAt: new Date().toISOString(),
          processingEndpoint: 'https://api.example.com/process',
          metadata: { priority: 'high', retries: 3 }
        }
        data.stateContext?.setResponseContext?.(operationId, contextData, {})

        return {
          operationId,
          status: 'pending' as const,
          message: 'Batch operation initiated'
        } as AsyncOperationResponse
      }),
      poll: jest.fn().mockImplementation(async (_request, data) => {
        // Get context data from stateContext that was stored in performBatch
        const context = data.stateContext?.getRequestContext?.(data.operationId)
        const isHighPriority = context?.metadata?.priority === 'high'

        // Simulate polling for operation status
        if (data.operationId.includes('completed')) {
          return {
            status: 'completed' as const,
            message: 'Operation completed successfully',
            result: {
              processedRecords: context?.batchSize || 0,
              priority: context?.metadata?.priority,
              processingTime: isHighPriority ? '2s' : '5s'
            }
          } as PollResponse
        }

        return {
          status: 'pending' as const,
          message: `Operation still in progress (priority: ${context?.metadata?.priority})`
        } as PollResponse
      })
    }

    const action = new Action('test-destination', asyncActionDefinition)

    // Verify async support detection
    expect(action.hasAsyncSupport).toBe(true)
    expect(action.hasBatchSupport).toBe(true)

    // Test batch execution with async response
    const mockStateContext = {
      setResponseContext: jest.fn(),
      getRequestContext: jest.fn().mockReturnValue({
        batchSize: 2,
        metadata: { priority: 'high', retries: 3 }
      })
    }

    const batchResult = await action.executeBatch({
      data: mockPayloads,
      settings: mockSettings,
      mapping: {
        userId: { '@path': '$.userId' },
        email: { '@path': '$.email' }
      },
      auth: undefined,
      stateContext: mockStateContext as any
    })

    expect(batchResult).toHaveLength(2) // Should have responses for both payloads
    expect(batchResult[0]).toMatchObject({
      status: 202, // Accepted status for async operation
      body: expect.objectContaining({
        operationId: expect.stringContaining('op_'),
        status: 'pending',
        message: 'Batch operation initiated'
      })
    })

    // Test polling functionality
    const pollResult = await action.executePoll({
      operationId: 'op_completed_123',
      settings: mockSettings,
      auth: undefined,
      stateContext: mockStateContext as any
    })

    expect(pollResult).toMatchObject({
      status: 'completed',
      message: 'Operation completed successfully',
      result: { processedRecords: 2 }
    })

    // Test polling for pending operation
    const pendingPollResult = await action.executePoll({
      operationId: 'op_pending_456',
      settings: mockSettings,
      auth: undefined,
      stateContext: mockStateContext as any
    })

    expect(pendingPollResult).toMatchObject({
      status: 'pending',
      message: 'Operation still in progress (priority: high)'
    })
  })

  it('should throw error when polling is not supported', async () => {
    const syncActionDefinition = {
      title: 'Test Sync Action',
      description: 'Test action that does not support async operations',
      fields: {
        userId: {
          label: 'User ID',
          description: 'The user ID',
          type: 'string' as const,
          required: true
        }
      },
      perform: jest.fn()
    }

    const action = new Action('test-destination', syncActionDefinition)

    expect(action.hasAsyncSupport).toBe(false)

    // Should throw error when trying to poll
    await expect(
      action.executePoll({
        operationId: 'test-op-id',
        settings: mockSettings,
        auth: undefined
      })
    ).rejects.toThrow('This action does not support async operations or polling')
  })

  it('should throw error when poll method is missing but async is expected', async () => {
    const incompleteAsyncActionDefinition = {
      title: 'Test Incomplete Async Action',
      description: 'Test action with performBatch but no poll method',
      fields: {
        userId: {
          label: 'User ID',
          description: 'The user ID',
          type: 'string' as const,
          required: true
        }
      },
      perform: jest.fn(),
      performBatch: jest.fn()
      // Note: missing poll method
    }

    const action = new Action('test-destination', incompleteAsyncActionDefinition)

    expect(action.hasAsyncSupport).toBe(false)

    await expect(
      action.executePoll({
        operationId: 'test-op-id',
        settings: mockSettings,
        auth: undefined
      })
    ).rejects.toThrow('This action does not support async operations or polling')
  })
})
