import { Action } from '../action'
import { MultiAsyncOperationResponse, MultiPollResponse, MultiPollInput, ExecuteInput } from '../types'

describe('Multi Async Actions', () => {
  it('should support multi async operations with performBatch returning MultiAsyncOperationResponse', async () => {
    const testAction = new Action('test-destination', {
      title: 'Test Multi Async Action',
      description: 'Test action that supports multiple async operations',
      fields: {
        name: {
          label: 'Name',
          type: 'string',
          required: true
        }
      },
      async performBatch(_request: any, data: any) {
        // Simulate batch processing that returns multiple operation IDs
        const operations = data.payload.map((_payload: any, index: number) => ({
          operationId: `op-${index}`,
          status: 'pending' as const,
          payloadIndices: [index],
          context: {
            payloadIndex: index,
            createdAt: new Date().toISOString(),
            priority: index === 0 ? 'high' : 'normal',
            processingMetadata: { retries: 3, timeout: 30000 }
          }
        }))

        return {
          operations,
          batchStatus: 'pending',
          message: 'Multiple async operations initiated'
        } as MultiAsyncOperationResponse
      },
      async pollMultiple(
        _request: any,
        { payload, stateContext }: ExecuteInput<unknown, MultiPollInput<unknown, unknown>>
      ) {
        // Simulate polling multiple operations using context data
        const results = payload.operationIds.map((operationId: string, index: number) => {
          // Get context from stateContext instead of a non-existent contexts property
          const contextData = stateContext?.getRequestContext(`operation_${operationId}`)
          const context = contextData && typeof contextData === 'string' ? JSON.parse(contextData) : {}
          const priority = context?.priority
          return {
            operationId,
            status: 'completed' as const,
            result: {
              processedName: `processed-${index}`,
              priority: priority,
              originalIndex: context?.payloadIndex
            }
          }
        })

        return {
          overallStatus: 'completed',
          results,
          payloadResults: results.map((r: any) => r.result)
        } as MultiPollResponse
      }
    } as any)

    // Test that the action has async support
    expect(testAction.hasAsyncSupport).toBe(true)

    // Test batch execution with multiple payloads
    const result = await testAction.executeBatch({
      data: [{ name: 'test1' }, { name: 'test2' }, { name: 'test3' }],
      settings: {},
      mapping: {
        name: { '@path': '$.name' }
      },
      auth: undefined,
      features: {},
      statsContext: {
        statsClient: undefined as any,
        tags: []
      },
      logger: {
        info: console.log,
        warn: console.warn,
        error: console.error,
        debug: console.debug
      } as any
    })

    expect(result).toHaveLength(3)

    // All results should be successful with status 202 (Accepted)
    result.forEach((res) => {
      expect(res.status).toBe(202)
      const body = res.body as any
      expect(body.operations).toHaveLength(3)
      expect(body.operations[0].operationId).toBe('op-0')
      expect(body.operations[1].operationId).toBe('op-1')
      expect(body.operations[2].operationId).toBe('op-2')
      expect(body.message).toBe('Multiple async operations initiated')
    })
  })

  it('should support polling multiple operations', async () => {
    const testAction = new Action('test-destination', {
      title: 'Test Multi Async Action',
      description: 'Test action that supports multiple async operations',
      fields: {
        name: {
          label: 'Name',
          type: 'string',
          required: true
        }
      },
      async performBatch() {
        return {
          operations: [
            { operationId: 'op-1', status: 'pending', payloadIndices: [0] },
            { operationId: 'op-2', status: 'pending', payloadIndices: [1] }
          ]
        } as MultiAsyncOperationResponse
      },
      async pollMultiple(_request: any, { payload }: ExecuteInput<unknown, MultiPollInput<unknown, unknown>>) {
        return {
          overallStatus: 'completed',
          results: payload.operationIds.map((id: string) => ({
            operationId: id,
            status: 'completed' as const,
            result: { processed: true, operationId: id }
          })),
          payloadResults: payload.operationIds.map((id: string) => ({ processed: true, operationId: id }))
        } as MultiPollResponse
      }
    } as any)

    const pollResult = await testAction.executePollMultiple({
      operationIds: ['op-1', 'op-2'],
      settings: {},
      auth: undefined,
      features: {},
      statsContext: {
        statsClient: undefined as any,
        tags: []
      },
      logger: {
        info: console.log,
        warn: console.warn,
        error: console.error,
        debug: console.debug
      } as any
    })

    expect(pollResult.overallStatus).toBe('completed')
    expect(pollResult.results).toHaveLength(2)
    expect(pollResult.results[0]).toEqual({
      operationId: 'op-1',
      status: 'completed',
      result: { processed: true, operationId: 'op-1' }
    })
    expect(pollResult.results[1]).toEqual({
      operationId: 'op-2',
      status: 'completed',
      result: { processed: true, operationId: 'op-2' }
    })
    expect(pollResult.results).toHaveLength(2)
  })

  it('should throw error when pollMultiple is not supported', async () => {
    const testAction = new Action('test-destination', {
      title: 'Test Action Without Multi Poll',
      description: 'Test action without multi polling support',
      fields: {
        name: {
          label: 'Name',
          type: 'string',
          required: true
        }
      },
      async performBatch() {
        return { success: true }
      }
    } as any)

    await expect(
      testAction.executePollMultiple({
        operationIds: ['op-1', 'op-2'],
        settings: {},
        auth: undefined,
        features: {},
        statsContext: {
          statsClient: undefined as any,
          tags: []
        },
        logger: {
          info: console.log,
          warn: console.warn,
          error: console.error,
          debug: console.debug
        } as any
      })
    ).rejects.toThrow('This action does not support async operations or polling.')
  })

  it('should throw error when pollMultiple method is missing but multi async is expected', async () => {
    const testAction = new Action('test-destination', {
      title: 'Test Multi Async Without Poll',
      description: 'Test action that has async support but missing pollMultiple',
      fields: {
        name: {
          label: 'Name',
          type: 'string',
          required: true
        }
      },
      async performBatch() {
        return {
          operations: [{ operationId: 'op-1', status: 'pending', payloadIndices: [0] }]
        } as MultiAsyncOperationResponse
      },
      async poll() {
        return { status: 'completed', result: {} }
      }
    } as any)

    await expect(
      testAction.executePollMultiple({
        operationIds: ['op-1'],
        settings: {},
        auth: undefined,
        features: {},
        statsContext: {
          statsClient: undefined as any,
          tags: []
        },
        logger: {
          info: console.log,
          warn: console.warn,
          error: console.error,
          debug: console.debug
        } as any
      })
    ).rejects.toThrow('Missing pollMultiple implementation for multi-async action.')
  })

  it('should correctly detect MultiAsyncOperationResponse format', async () => {
    const testAction = new Action('test-destination', {
      title: 'Test Multi Async Format Detection',
      description: 'Test action for format detection',
      fields: {
        name: {
          label: 'Name',
          type: 'string',
          required: true
        }
      },
      async performBatch() {
        // Return a properly formatted MultiAsyncOperationResponse
        return {
          operations: [
            {
              operationId: 'batch-op-1',
              status: 'pending',
              payloadIndices: [0, 1]
            },
            {
              operationId: 'batch-op-2',
              status: 'pending',
              payloadIndices: [2]
            }
          ],
          message: 'Batch split into multiple operations'
        } as MultiAsyncOperationResponse
      },
      async pollMultiple() {
        return {
          overallStatus: 'completed',
          results: [],
          payloadResults: []
        } as MultiPollResponse
      }
    } as any)

    const result = await testAction.executeBatch({
      data: [{ name: 'item1' }, { name: 'item2' }, { name: 'item3' }],
      settings: {},
      mapping: {
        name: { '@path': '$.name' }
      },
      auth: undefined,
      features: {},
      statsContext: {
        statsClient: undefined as any,
        tags: []
      },
      logger: {
        info: console.log,
        warn: console.warn,
        error: console.error,
        debug: console.debug
      } as any
    })

    expect(result).toHaveLength(3)

    // Each result should contain the multi-operation response
    result.forEach((res) => {
      expect(res.status).toBe(202)
      const body = res.body as any
      expect(body.operations).toHaveLength(2)
      expect(body.operations[0].operationId).toBe('batch-op-1')
      expect(body.operations[1].operationId).toBe('batch-op-2')
      expect(body.message).toBe('Batch split into multiple operations')
    })
  })
})
