import nock from 'nock'
import { createTestEvent, createTestIntegration, PayloadValidationError } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const defaultMapping = {
  identifier: {
    email: { '@path': '$.properties.email' },
    userId: { '@path': '$.userId' }
  },
  user_identifier_preference: 'email',
  subscription: {
    subscription_group_type: 'messageChannel',
    subscription_group_id: '123',
    action: 'subscribe'
  },
  enable_batching: false
}

describe('Iterable.updateSubscription', () => {
  afterEach(() => {
    nock.cleanAll()
  })

  describe('perform', () => {
    it('subscribes a user by email using PATCH', async () => {
      const event = createTestEvent({
        type: 'track',
        event: 'Subscriptions Updated',
        userId: 'user123',
        properties: {
          email: 'test@iterable.com'
        }
      })

      nock('https://api.iterable.com')
        .patch('/api/subscriptions/messageChannel/123/user/test%40iterable.com')
        .reply(200, { code: 'Success', msg: '' })

      const responses = await testDestination.testAction('updateSubscription', {
        event,
        mapping: defaultMapping
      })

      expect(responses[0].status).toBe(200)
    })

    it('subscribes a user by userId using PATCH', async () => {
      const event = createTestEvent({
        type: 'track',
        event: 'Subscriptions Updated',
        userId: 'user123',
        properties: {}
      })

      nock('https://api.iterable.com')
        .patch('/api/subscriptions/messageChannel/123/byUserId/user123')
        .reply(200, { code: 'Success', msg: '' })

      const responses = await testDestination.testAction('updateSubscription', {
        event,
        mapping: {
          ...defaultMapping,
          identifier: {
            email: { '@path': '$.properties.email' },
            userId: { '@path': '$.userId' }
          },
          user_identifier_preference: 'userId'
        }
      })

      expect(responses[0].status).toBe(200)
    })

    it('unsubscribes a user by email using DELETE', async () => {
      const event = createTestEvent({
        type: 'track',
        event: 'Subscriptions Updated',
        userId: 'user123',
        properties: {
          email: 'test@iterable.com'
        }
      })

      nock('https://api.iterable.com')
        .delete('/api/subscriptions/messageChannel/456/user/test%40iterable.com')
        .reply(200, { code: 'Success', msg: '' })

      const responses = await testDestination.testAction('updateSubscription', {
        event,
        mapping: {
          ...defaultMapping,
          subscription: {
            subscription_group_type: 'messageChannel',
            subscription_group_id: '456',
            action: 'unsubscribe'
          }
        }
      })

      expect(responses[0].status).toBe(200)
    })

    it('prefers email when preference is email and both are provided', async () => {
      const event = createTestEvent({
        type: 'track',
        event: 'Subscriptions Updated',
        userId: 'user123',
        properties: {
          email: 'test@iterable.com'
        }
      })

      nock('https://api.iterable.com')
        .patch('/api/subscriptions/messageChannel/123/user/test%40iterable.com')
        .reply(200, { code: 'Success', msg: '' })

      const responses = await testDestination.testAction('updateSubscription', {
        event,
        mapping: {
          ...defaultMapping,
          user_identifier_preference: 'email'
        }
      })

      expect(responses[0].status).toBe(200)
    })

    it('prefers userId when preference is userId and both are provided', async () => {
      const event = createTestEvent({
        type: 'track',
        event: 'Subscriptions Updated',
        userId: 'user123',
        properties: {
          email: 'test@iterable.com'
        }
      })

      nock('https://api.iterable.com')
        .patch('/api/subscriptions/messageChannel/123/byUserId/user123')
        .reply(200, { code: 'Success', msg: '' })

      const responses = await testDestination.testAction('updateSubscription', {
        event,
        mapping: {
          ...defaultMapping,
          user_identifier_preference: 'userId'
        }
      })

      expect(responses[0].status).toBe(200)
    })

    it('falls back to userId when preference is email but email is missing', async () => {
      const event = createTestEvent({
        type: 'track',
        event: 'Subscriptions Updated',
        userId: 'user123',
        properties: {}
      })

      nock('https://api.iterable.com')
        .patch('/api/subscriptions/messageChannel/123/byUserId/user123')
        .reply(200, { code: 'Success', msg: '' })

      const responses = await testDestination.testAction('updateSubscription', {
        event,
        mapping: {
          ...defaultMapping,
          identifier: {
            userId: { '@path': '$.userId' }
          },
          user_identifier_preference: 'email'
        }
      })

      expect(responses[0].status).toBe(200)
    })

    it('throws PayloadValidationError when both email and userId are missing', async () => {
      const event = createTestEvent({
        type: 'track',
        event: 'Subscriptions Updated',
        userId: null,
        properties: {}
      })

      await expect(
        testDestination.testAction('updateSubscription', {
          event,
          mapping: {
            ...defaultMapping,
            identifier: {}
          }
        })
      ).rejects.toThrowError(PayloadValidationError)
    })

    it('uses Europe endpoint when data center is configured', async () => {
      const event = createTestEvent({
        type: 'track',
        event: 'Subscriptions Updated',
        properties: { email: 'test@iterable.com' }
      })

      nock('https://api.eu.iterable.com')
        .patch('/api/subscriptions/messageChannel/123/user/test%40iterable.com')
        .reply(200, { code: 'Success', msg: '' })

      const responses = await testDestination.testAction('updateSubscription', {
        event,
        mapping: defaultMapping,
        settings: { apiKey: 'test-api-key', dataCenterLocation: 'europe' }
      })

      expect(responses[0].status).toBe(200)
    })
  })

  describe('performBatch', () => {
    it('subscribes multiple users via bulk PUT endpoint', async () => {
      const events = [
        createTestEvent({
          type: 'track',
          event: 'Subscriptions Updated',
          userId: 'user1',
          properties: { email: 'user1@iterable.com' }
        }),
        createTestEvent({
          type: 'track',
          event: 'Subscriptions Updated',
          userId: 'user2',
          properties: { email: 'user2@iterable.com' }
        })
      ]

      nock('https://api.iterable.com')
        .put('/api/subscriptions/messageChannel/123?action=subscribe')
        .reply(200, { code: 'Success', msg: '' })

      const response = await testDestination.testBatchAction('updateSubscription', {
        events,
        mapping: defaultMapping
      })

      expect(response[0].status).toBe(200)

      const multistatus = testDestination.results[0].multistatus
      expect(multistatus![0]).toMatchObject({
        status: 200,
        sent: { users: ['user1@iterable.com'] },
        body: { success: true }
      })
      expect(multistatus![1]).toMatchObject({
        status: 200,
        sent: { users: ['user2@iterable.com'] },
        body: { success: true }
      })
    })

    it('unsubscribes multiple users via bulk PUT endpoint', async () => {
      const events = [
        createTestEvent({
          type: 'track',
          event: 'Subscriptions Updated',
          userId: 'user1',
          properties: { email: 'user1@iterable.com' }
        }),
        createTestEvent({
          type: 'track',
          event: 'Subscriptions Updated',
          userId: 'user2',
          properties: { email: 'user2@iterable.com' }
        })
      ]

      nock('https://api.iterable.com')
        .put('/api/subscriptions/messageChannel/456?action=unsubscribe')
        .reply(200, { code: 'Success', msg: '' })

      const response = await testDestination.testBatchAction('updateSubscription', {
        events,
        mapping: {
          ...defaultMapping,
          subscription: {
            subscription_group_type: 'messageChannel',
            subscription_group_id: '456',
            action: 'unsubscribe'
          }
        }
      })

      expect(response[0].status).toBe(200)
    })

    it('separates users by email and userId in batch request body', async () => {
      const events = [
        createTestEvent({
          type: 'track',
          event: 'Subscriptions Updated',
          userId: 'user1',
          properties: { email: 'user1@iterable.com' }
        }),
        createTestEvent({
          type: 'track',
          event: 'Subscriptions Updated',
          userId: 'user2',
          properties: {}
        })
      ]

      nock('https://api.iterable.com')
        .put('/api/subscriptions/messageChannel/123?action=subscribe', (body) => {
          return body.users.includes('user1@iterable.com') && body.usersByUserId.includes('user2')
        })
        .reply(200, { code: 'Success', msg: '' })

      const response = await testDestination.testBatchAction('updateSubscription', {
        events,
        mapping: {
          ...defaultMapping,
          user_identifier_preference: 'email'
        }
      })

      expect(response[0].status).toBe(200)
    })

    it('returns error in MultiStatusResponse for payloads missing identifiers', async () => {
      const events = [
        createTestEvent({
          type: 'track',
          event: 'Subscriptions Updated',
          userId: null,
          properties: {}
        }),
        createTestEvent({
          type: 'track',
          event: 'Subscriptions Updated',
          properties: { email: 'valid@iterable.com' }
        })
      ]

      nock('https://api.iterable.com')
        .put('/api/subscriptions/messageChannel/123?action=subscribe')
        .reply(200, { code: 'Success', msg: '' })

      await testDestination.testBatchAction('updateSubscription', {
        events,
        mapping: {
          ...defaultMapping,
          identifier: {
            email: { '@path': '$.properties.email' },
            userId: { '@path': '$.userId' }
          }
        }
      })

      const multistatus = testDestination.results[0].multistatus

      expect(multistatus).toBeDefined()
      expect(multistatus![0]).toMatchObject({
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: 'Must include email or userId in identifier.'
      })
      expect(multistatus![1]).toMatchObject({
        status: 200
      })
    })

    it('marks all payloads as failed when API call fails', async () => {
      const events = [
        createTestEvent({
          type: 'track',
          event: 'Subscriptions Updated',
          properties: { email: 'user1@iterable.com' }
        }),
        createTestEvent({
          type: 'track',
          event: 'Subscriptions Updated',
          properties: { email: 'user2@iterable.com' }
        })
      ]

      nock('https://api.iterable.com')
        .put('/api/subscriptions/messageChannel/123?action=subscribe')
        .reply(400, { code: 'BadParams', msg: 'Invalid subscription group' })

      await testDestination.testBatchAction('updateSubscription', {
        events,
        mapping: defaultMapping
      })

      const multistatus = testDestination.results[0].multistatus

      expect(multistatus).toBeDefined()
      expect(multistatus![0]).toMatchObject({
        status: 400,
        errortype: 'UNKNOWN_ERROR',
        errormessage: 'Invalid subscription group',
        sent: { users: ['user1@iterable.com'] },
        body: { code: 'BadParams', msg: 'Invalid subscription group' }
      })
      expect(multistatus![1]).toMatchObject({
        status: 400,
        errortype: 'UNKNOWN_ERROR',
        errormessage: 'Invalid subscription group',
        sent: { users: ['user2@iterable.com'] },
        body: { code: 'BadParams', msg: 'Invalid subscription group' }
      })
    })

    it('returns PAYLOAD_VALIDATION_FAILED in MultiStatusResponse for invalid action in batch', async () => {
      const events = [
        createTestEvent({
          type: 'track',
          event: 'Subscriptions Updated',
          properties: { email: 'user1@iterable.com' }
        }),
        createTestEvent({
          type: 'track',
          event: 'Subscriptions Updated',
          properties: { email: 'user2@iterable.com' }
        })
      ]

      await testDestination.testBatchAction('updateSubscription', {
        events,
        mapping: {
          ...defaultMapping,
          subscription: {
            subscription_group_type: 'messageChannel',
            subscription_group_id: '123',
            action: 'invalid_action'
          }
        }
      })

      const multistatus = testDestination.results[0].multistatus

      expect(multistatus).toBeDefined()
      expect(multistatus![0]).toMatchObject({
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED'
      })
      expect(multistatus![0].errormessage).toContain('subscribe')
      expect(multistatus![1]).toMatchObject({
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED'
      })
      expect(multistatus![1].errormessage).toContain('subscribe')
    })

    it('throws PayloadValidationError when payloads in a batch have differing subscriptions', async () => {
      const events = [
        createTestEvent({
          type: 'track',
          event: 'Subscriptions Updated',
          properties: {
            email: 'user1@iterable.com',
            subscription: { subscription_group_type: 'messageChannel', subscription_group_id: '123', action: 'subscribe' }
          }
        }),
        createTestEvent({
          type: 'track',
          event: 'Subscriptions Updated',
          properties: {
            email: 'user2@iterable.com',
            subscription: { subscription_group_type: 'messageChannel', subscription_group_id: '456', action: 'unsubscribe' }
          }
        })
      ]

      await expect(
        testDestination.testBatchAction('updateSubscription', {
          events,
          mapping: {
            ...defaultMapping,
            subscription: { '@path': '$.properties.subscription' }
          }
        })
      ).rejects.toThrowError(PayloadValidationError)
    })
  })
})
