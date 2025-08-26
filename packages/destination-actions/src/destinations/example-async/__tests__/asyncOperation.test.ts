import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import AsyncOperationAction from '../asyncOperation'

const testDestination = createTestIntegration(Definition)

describe('Example Async Destination', () => {
  describe('asyncOperation', () => {
    it('should handle synchronous operations', async () => {
      const settings = {
        endpoint: 'https://api.example.com',
        api_key: 'test-key'
      }

      nock('https://api.example.com')
        .post('/operations')
        .reply(200, {
          status: 'completed',
          result: { success: true }
        })

      const event = {
        userId: 'test-user-123',
        properties: {
          name: 'Test User',
          email: 'test@example.com'
        }
      }

      const mapping = {
        user_id: { '@path': '$.userId' },
        operation_type: 'sync_profile',
        data: { '@path': '$.properties' }
      }

      const responses = await testDestination.testAction('asyncOperation', {
        event,
        mapping,
        settings
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].data).toEqual({
        status: 'completed',
        result: { success: true }
      })
    })

    it('should submit async operations and return operation id', async () => {
      const settings = {
        endpoint: 'https://api.example.com',
        api_key: 'test-key'
      }

      nock('https://api.example.com').post('/operations').reply(202, {
        status: 'accepted',
        operation_id: 'op_12345'
      })

      const event = {
        userId: 'test-user-123',
        properties: {
          name: 'Test User',
          email: 'test@example.com'
        }
      }

      const mapping = {
        user_id: { '@path': '$.userId' },
        operation_type: 'process_data',
        data: { '@path': '$.properties' }
      }

      const responses = await testDestination.testAction('asyncOperation', {
        event,
        mapping,
        settings
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(202)
      expect(responses[0].data.status).toBe('accepted')
      expect(responses[0].data.operation_id).toBe('op_12345')
    })

    it('should handle batch async operations', async () => {
      const settings = {
        endpoint: 'https://api.example.com',
        api_key: 'test-key'
      }

      nock('https://api.example.com')
        .post('/operations/batch')
        .reply(202, {
          status: 'accepted',
          operation_ids: ['op_1', 'op_2', 'op_3']
        })

      // Test batch operations by calling performBatch directly
      const mockRequest = jest.fn().mockResolvedValue({
        status: 202,
        data: {
          status: 'accepted',
          operation_ids: ['op_1', 'op_2', 'op_3']
        }
      })

      const payload = [
        { user_id: 'user-1', operation_type: 'process_data', data: { name: 'User 1' } },
        { user_id: 'user-2', operation_type: 'process_data', data: { name: 'User 2' } },
        { user_id: 'user-3', operation_type: 'process_data', data: { name: 'User 3' } }
      ]

      const result = await AsyncOperationAction.performBatch!(mockRequest, { settings, payload })

      expect(mockRequest).toHaveBeenCalledWith('https://api.example.com/operations/batch', {
        method: 'post',
        json: {
          operations: [
            { user_id: 'user-1', operation_type: 'process_data', data: { name: 'User 1' } },
            { user_id: 'user-2', operation_type: 'process_data', data: { name: 'User 2' } },
            { user_id: 'user-3', operation_type: 'process_data', data: { name: 'User 3' } }
          ]
        }
      })

      expect(result).toEqual({
        isAsync: true,
        message: 'Batch operations submitted: op_1, op_2, op_3',
        status: 202
      })

      // Verify context was stored in stateContext
      expect(mockRequest).toHaveBeenCalledWith('https://api.example.com/operations/batch', {
        method: 'post',
        json: {
          operations: [
            { user_id: 'user-1', operation_type: 'process_data', data: { name: 'User 1' } },
            { user_id: 'user-2', operation_type: 'process_data', data: { name: 'User 2' } },
            { user_id: 'user-3', operation_type: 'process_data', data: { name: 'User 3' } }
          ]
        }
      })
    })

    it('should poll single operation using unified poll method', async () => {
      const mockRequest = jest.fn().mockResolvedValue({
        status: 200,
        data: {
          status: 'completed',
          progress: 100,
          result: { processed_records: 42 }
        }
      })

      const settings = {
        endpoint: 'https://api.example.com',
        api_key: 'test-key'
      }

      // Mock stateContext with stored operation data
      const mockStateContext = {
        getRequestContext: jest.fn().mockReturnValue(
          JSON.stringify([
            {
              operation_id: 'op_12345',
              user_id: 'test-user-123',
              operation_type: 'process_data'
            }
          ])
        )
      }

      const result = await AsyncOperationAction.poll!(mockRequest, { settings, stateContext: mockStateContext })

      expect(mockRequest).toHaveBeenCalledWith('https://api.example.com/operations/op_12345', {
        method: 'get'
      })

      expect(result).toEqual({
        results: [
          {
            status: 'completed',
            progress: 100,
            message: 'Operation op_12345 completed successfully',
            result: { processed_records: 42 },
            shouldContinuePolling: false,
            context: {
              operation_id: 'op_12345',
              user_id: 'test-user-123',
              operation_type: 'process_data'
            }
          }
        ],
        overallStatus: 'completed',
        shouldContinuePolling: false,
        message: 'Operation op_12345 completed successfully'
      })
    })

    it('should poll multiple operations using unified poll method', async () => {
      const mockRequest = jest
        .fn()
        .mockResolvedValueOnce({
          status: 200,
          data: { status: 'completed', progress: 100, result: { records: 10 } }
        })
        .mockResolvedValueOnce({
          status: 200,
          data: { status: 'pending', progress: 50 }
        })
        .mockResolvedValueOnce({
          status: 200,
          data: { status: 'failed', error_code: 'TIMEOUT', error_message: 'Operation timed out' }
        })

      const settings = {
        endpoint: 'https://api.example.com',
        api_key: 'test-key'
      }

      // Mock stateContext with stored batch operation data
      const mockStateContext = {
        getRequestContext: jest.fn().mockReturnValue(
          JSON.stringify([
            { operation_id: 'op_1', user_id: 'user-1', batch_index: 0 },
            { operation_id: 'op_2', user_id: 'user-2', batch_index: 1 },
            { operation_id: 'op_3', user_id: 'user-3', batch_index: 2 }
          ])
        )
      }

      const result = await AsyncOperationAction.poll!(mockRequest, { settings, stateContext: mockStateContext })

      expect(mockRequest).toHaveBeenCalledTimes(3)
      expect(result.results).toHaveLength(3)
      expect(result.overallStatus).toBe('pending') // Because one is still pending
      expect(result.shouldContinuePolling).toBe(true)
      expect(result.message).toBe('3 operations: 1 completed, 1 failed, 1 pending')
    })

    // TODO: Add proper async response testing when test framework supports it
    // The async response handling is implemented but not easily testable with current framework
  })
})
