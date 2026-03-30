import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import destination from '../index'

const testDestination = createTestIntegration(destination)
const settings = { apiEndpoint: 'https://i.klime.com', writeKey: 'test-write-key' }

describe('Klime', () => {
  afterEach(() => {
    nock.cleanAll()
  })

  describe('track', () => {
    it('should send a track event with default mappings', async () => {
      const event = createTestEvent({
        type: 'track',
        event: 'Button Clicked',
        userId: 'user_123',
        properties: { buttonName: 'Sign up' }
      })

      nock('https://i.klime.com')
        .post('/v1/batch')
        .matchHeader('Authorization', 'Bearer test-write-key')
        .reply(200, { status: 'ok', accepted: 1, failed: 0 })

      const responses = await testDestination.testAction('track', {
        event,
        settings,
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
    })

    it('should send correct payload structure', async () => {
      const mapping = {
        messageId: 'msg-123',
        event: 'Page Viewed',
        userId: 'user-456',
        properties: { page: '/home' },
        timestamp: '2024-01-15T10:00:00Z',
        enable_batching: true
      }

      nock('https://i.klime.com')
        .post('/v1/batch', {
          batch: [
            {
              type: 'track',
              messageId: 'msg-123',
              event: 'Page Viewed',
              userId: 'user-456',
              properties: { page: '/home' },
              timestamp: '2024-01-15T10:00:00Z'
            }
          ]
        })
        .reply(200, { status: 'ok', accepted: 1, failed: 0 })

      const responses = await testDestination.testAction('track', {
        mapping,
        settings
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
    })

    it('should send batch events', async () => {
      const events = [
        createTestEvent({ type: 'track', event: 'Event 1', userId: 'user_1' }),
        createTestEvent({ type: 'track', event: 'Event 2', userId: 'user_2' })
      ]

      nock('https://i.klime.com').post('/v1/batch').reply(200, { status: 'ok', accepted: 2, failed: 0 })

      const responses = await testDestination.testBatchAction('track', {
        events,
        settings,
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
    })
  })

  describe('identify', () => {
    it('should send an identify event with default mappings', async () => {
      const event = createTestEvent({
        type: 'identify',
        userId: 'user_123',
        traits: { email: 'test@example.com', name: 'Test User' }
      })

      nock('https://i.klime.com')
        .post('/v1/batch')
        .matchHeader('Authorization', 'Bearer test-write-key')
        .reply(200, { status: 'ok', accepted: 1, failed: 0 })

      const responses = await testDestination.testAction('identify', {
        event,
        settings,
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
    })

    it('should send correct payload structure', async () => {
      const mapping = {
        messageId: 'msg-789',
        userId: 'user-abc',
        traits: { email: 'test@example.com', plan: 'enterprise' },
        timestamp: '2024-01-15T10:00:00Z',
        enable_batching: true
      }

      nock('https://i.klime.com')
        .post('/v1/batch', {
          batch: [
            {
              type: 'identify',
              messageId: 'msg-789',
              userId: 'user-abc',
              traits: { email: 'test@example.com', plan: 'enterprise' },
              timestamp: '2024-01-15T10:00:00Z'
            }
          ]
        })
        .reply(200, { status: 'ok', accepted: 1, failed: 0 })

      const responses = await testDestination.testAction('identify', {
        mapping,
        settings
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
    })

    it('should send batch identify events', async () => {
      const events = [
        createTestEvent({ type: 'identify', userId: 'user_1', traits: { name: 'User 1' } }),
        createTestEvent({ type: 'identify', userId: 'user_2', traits: { name: 'User 2' } })
      ]

      nock('https://i.klime.com').post('/v1/batch').reply(200, { status: 'ok', accepted: 2, failed: 0 })

      const responses = await testDestination.testBatchAction('identify', {
        events,
        settings,
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
    })
  })

  describe('group', () => {
    it('should send a group event with default mappings', async () => {
      const event = createTestEvent({
        type: 'group',
        groupId: 'group-acme',
        userId: 'user_123',
        traits: { name: 'Acme Inc', plan: 'enterprise' }
      })

      nock('https://i.klime.com')
        .post('/v1/batch')
        .matchHeader('Authorization', 'Bearer test-write-key')
        .reply(200, { status: 'ok', accepted: 1, failed: 0 })

      const responses = await testDestination.testAction('group', {
        event,
        settings,
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
    })

    it('should send correct payload structure', async () => {
      const mapping = {
        messageId: 'msg-group',
        groupId: 'group-acme',
        userId: 'user-xyz',
        traits: { name: 'Acme Inc', industry: 'Technology' },
        timestamp: '2024-01-15T10:00:00Z',
        enable_batching: true
      }

      nock('https://i.klime.com')
        .post('/v1/batch', {
          batch: [
            {
              type: 'group',
              messageId: 'msg-group',
              groupId: 'group-acme',
              userId: 'user-xyz',
              traits: { name: 'Acme Inc', industry: 'Technology' },
              timestamp: '2024-01-15T10:00:00Z'
            }
          ]
        })
        .reply(200, { status: 'ok', accepted: 1, failed: 0 })

      const responses = await testDestination.testAction('group', {
        mapping,
        settings
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
    })

    it('should send batch group events', async () => {
      const events = [
        createTestEvent({ type: 'group', groupId: 'group_1', traits: { name: 'Group 1' } }),
        createTestEvent({ type: 'group', groupId: 'group_2', traits: { name: 'Group 2' } })
      ]

      nock('https://i.klime.com').post('/v1/batch').reply(200, { status: 'ok', accepted: 2, failed: 0 })

      const responses = await testDestination.testBatchAction('group', {
        events,
        settings,
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
    })
  })
})
