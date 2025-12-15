import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

describe('Lark', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock('https://api.uselark.ai').get('/subjects').reply(200, { data: [] })

      const authData = { apiKey: 'test-api-key' }

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })

    it('should fail with invalid API key', async () => {
      nock('https://api.uselark.ai').get('/subjects').reply(401, { error: 'Unauthorized' })

      const authData = { apiKey: 'invalid-api-key' }

      await expect(testDestination.testAuthentication(authData)).rejects.toThrowError()
    })
  })

  describe('createUsageEvent', () => {
    it('should send a usage event to Lark', async () => {
      nock('https://api.uselark.ai').post('/usage-events').reply(200, {})

      const event = createTestEvent({
        type: 'track',
        event: 'Job Completed',
        userId: 'user-123',
        messageId: 'msg-123',
        timestamp: '2024-01-15T10:30:00.000Z',
        properties: {
          compute_hours: 100.5,
          instance_type: 't2.micro',
          region: 'us-east-1'
        }
      })

      const responses = await testDestination.testAction('createUsageEvent', {
        event,
        settings: { apiKey: 'test-api-key' },
        mapping: {
          event_name: { '@path': '$.event' },
          subject_id: { '@path': '$.userId' },
          idempotency_key: { '@path': '$.messageId' },
          timestamp: { '@path': '$.timestamp' },
          data: { '@path': '$.properties' }
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)

      const requestBody = JSON.parse(responses[0].options.body as string)
      expect(requestBody.event_name).toBe('Job Completed')
      expect(requestBody.subject_id).toBe('user-123')
      expect(requestBody.idempotency_key).toBe('msg-123')
      expect(requestBody.data.compute_hours).toBe(100.5)
    })

    it('should use anonymousId when userId is not available', async () => {
      nock('https://api.uselark.ai').post('/usage-events').reply(200, {})

      const event = createTestEvent({
        type: 'track',
        event: 'API Call',
        anonymousId: 'anon-456',
        messageId: 'msg-456',
        properties: {
          endpoint: '/api/users'
        }
      })

      const responses = await testDestination.testAction('createUsageEvent', {
        event,
        settings: { apiKey: 'test-api-key' },
        mapping: {
          event_name: { '@path': '$.event' },
          subject_id: {
            '@if': {
              exists: { '@path': '$.userId' },
              then: { '@path': '$.userId' },
              else: { '@path': '$.anonymousId' }
            }
          },
          idempotency_key: { '@path': '$.messageId' },
          data: { '@path': '$.properties' }
        }
      })

      expect(responses.length).toBe(1)
      const requestBody = JSON.parse(responses[0].options.body as string)
      expect(requestBody.subject_id).toBe('anon-456')
    })
  })
})
