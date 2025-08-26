import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

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

    // TODO: Add proper async response testing when test framework supports it
    // The async response handling is implemented but not easily testable with current framework
    // Poll functionality would be tested through integration tests or by calling executePoll directly
  })
})
