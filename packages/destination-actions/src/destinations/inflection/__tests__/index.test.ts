import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../index'
import { PRODUCTION_URL, TESTING_URL } from '../constants'

const testDestination = createTestIntegration(Destination)
const settings = { apiKey: 'test-key', environment: 'production' }
const timestamp = '2026-08-19T13:55:37.959Z'

describe('Inflection', () => {
  afterEach(() => nock.cleanAll())

  describe('track', () => {
    it('sends the expected payload with basic auth', async () => {
      nock(PRODUCTION_URL).post('/').reply(200, {})

      const responses = await testDestination.testAction('track', {
        settings,
        event: createTestEvent({
          type: 'track',
          event: 'Signed Up',
          userId: '583',
          anonymousId: 'anon-1',
          messageId: 'msg-1',
          timestamp,
          properties: { plan: 'pro', nested: { a: 1 }, list: [1, 2] },
          context: { groupId: 'group-1' }
        }),
        useDefaultMappings: true
      })

      expect(responses[0].options.headers?.get('authorization')).toBe('Basic dGVzdC1rZXk6')
      expect(responses[0].options.json).toEqual({
        type: 'track',
        event: 'Signed Up',
        userId: '583',
        anonymousId: 'anon-1',
        messageId: 'msg-1',
        timestamp,
        properties: { plan: 'pro', nested: '{"a":1}', list: '[1,2]' },
        context: { groupId: 'group-1' }
      })
    })

    it('omits context when there is no group ID', async () => {
      nock(PRODUCTION_URL).post('/').reply(200, {})

      const responses = await testDestination.testAction('track', {
        settings,
        event: createTestEvent({ type: 'track', event: 'Signed Up', userId: '583', timestamp, context: {} }),
        useDefaultMappings: true
      })

      expect(responses[0].options.json).not.toHaveProperty('context')
    })

    it('rejects an event without a userId', async () => {
      await expect(
        testDestination.testAction('track', {
          settings,
          event: createTestEvent({ type: 'track', event: 'Signed Up', userId: undefined, timestamp }),
          useDefaultMappings: true
        })
      ).rejects.toThrowError("The root value is missing the required field 'userId'.")
    })
  })

  describe('identify', () => {
    it('merges email into traits and stringifies nested values', async () => {
      nock(PRODUCTION_URL).post('/').reply(200, {})

      const responses = await testDestination.testAction('identify', {
        settings,
        event: createTestEvent({
          type: 'identify',
          userId: '583',
          messageId: 'msg-1',
          timestamp,
          traits: { email: 'a@b.com', address: { city: 'Toronto' } }
        }),
        useDefaultMappings: true
      })

      expect(responses[0].options.json).toMatchObject({
        type: 'identify',
        userId: '583',
        traits: { email: 'a@b.com', address: '{"city":"Toronto"}' }
      })
    })

    it('rejects an event without an email', async () => {
      await expect(
        testDestination.testAction('identify', {
          settings,
          event: createTestEvent({ type: 'identify', userId: '583', timestamp, traits: {} }),
          useDefaultMappings: true
        })
      ).rejects.toThrowError("The root value is missing the required field 'email'.")
    })
  })

  describe('group', () => {
    it('sends the expected payload', async () => {
      nock(PRODUCTION_URL).post('/').reply(200, {})

      const responses = await testDestination.testAction('group', {
        settings,
        event: createTestEvent({
          type: 'group',
          userId: '583',
          groupId: 'group-1',
          messageId: 'msg-1',
          timestamp,
          traits: { name: 'Acme', meta: ['x'] }
        }),
        useDefaultMappings: true
      })

      expect(responses[0].options.json).toMatchObject({
        type: 'group',
        userId: '583',
        groupId: 'group-1',
        traits: { name: 'Acme', meta: '["x"]' }
      })
    })

    it('rejects an event without a groupId', async () => {
      await expect(
        testDestination.testAction('group', {
          settings,
          event: createTestEvent({ type: 'group', userId: '583', groupId: undefined, timestamp }),
          useDefaultMappings: true
        })
      ).rejects.toThrowError("The root value is missing the required field 'groupId'.")
    })
  })

  describe('string trimming', () => {
    it('trims identifiers and string values in track', async () => {
      nock(PRODUCTION_URL).post('/').reply(200, {})

      const responses = await testDestination.testAction('track', {
        settings,
        event: createTestEvent({
          type: 'track',
          event: '  Signed Up ',
          userId: ' 583 ',
          anonymousId: ' anon-1 ',
          messageId: ' msg-1 ',
          timestamp,
          properties: { plan: ' pro ', count: 2 },
          context: { groupId: ' group-1 ' }
        }),
        useDefaultMappings: true
      })

      expect(responses[0].options.json).toEqual({
        type: 'track',
        event: 'Signed Up',
        userId: '583',
        anonymousId: 'anon-1',
        messageId: 'msg-1',
        timestamp,
        properties: { plan: 'pro', count: 2 },
        context: { groupId: 'group-1' }
      })
    })

    it('trims the email and trait values in identify', async () => {
      nock(PRODUCTION_URL).post('/').reply(200, {})

      const responses = await testDestination.testAction('identify', {
        settings,
        event: createTestEvent({
          type: 'identify',
          userId: ' 583 ',
          messageId: 'msg-1',
          timestamp,
          traits: { email: 'a@b.com', name: ' Ada ' }
        }),
        useDefaultMappings: true
      })

      expect(responses[0].options.json).toMatchObject({
        userId: '583',
        traits: { email: 'a@b.com', name: 'Ada' }
      })
    })

    it('trims group identifiers and traits', async () => {
      nock(PRODUCTION_URL).post('/').reply(200, {})

      const responses = await testDestination.testAction('group', {
        settings,
        event: createTestEvent({
          type: 'group',
          userId: ' 583 ',
          groupId: ' group-1 ',
          messageId: 'msg-1',
          timestamp,
          traits: { name: ' Acme ' }
        }),
        useDefaultMappings: true
      })

      expect(responses[0].options.json).toMatchObject({
        userId: '583',
        groupId: 'group-1',
        traits: { name: 'Acme' }
      })
    })

    it('rejects a required value that is only whitespace', async () => {
      await expect(
        testDestination.testAction('track', {
          settings,
          event: createTestEvent({ type: 'track', event: 'Signed Up', userId: '   ', timestamp }),
          useDefaultMappings: true
        })
      ).rejects.toThrowError('User ID must not be empty.')
    })

    it('omits a group ID that is only whitespace in track', async () => {
      nock(PRODUCTION_URL).post('/').reply(200, {})

      const responses = await testDestination.testAction('track', {
        settings,
        event: createTestEvent({
          type: 'track',
          event: 'Signed Up',
          userId: '583',
          timestamp,
          context: { groupId: '   ' }
        }),
        useDefaultMappings: true
      })

      expect(responses[0].options.json).not.toHaveProperty('context')
    })

    it('rejects an email padded with whitespace at schema validation', async () => {
      await expect(
        testDestination.testAction('identify', {
          settings,
          event: createTestEvent({
            type: 'identify',
            userId: '583',
            timestamp,
            traits: { email: ' a@b.com ' }
          }),
          useDefaultMappings: true
        })
      ).rejects.toThrowError('Email must be a valid email address string but it was not.')
    })
  })

  describe('empty values', () => {
    it('omits empty optional fields and empty trait/property values from track', async () => {
      nock(PRODUCTION_URL).post('/').reply(200, {})

      const responses = await testDestination.testAction('track', {
        settings,
        event: createTestEvent({
          type: 'track',
          event: 'Signed Up',
          userId: '583',
          anonymousId: '',
          messageId: 'msg-1',
          timestamp,
          properties: { a: null, b: '', c: '  ', d: {}, e: [], f: 0, g: false, h: 'x' },
          context: {}
        }),
        useDefaultMappings: true
      })

      expect(responses[0].options.json).toEqual({
        type: 'track',
        event: 'Signed Up',
        userId: '583',
        messageId: 'msg-1',
        timestamp,
        properties: { f: 0, g: false, h: 'x' }
      })
    })

    it('omits properties entirely when every value is empty', async () => {
      nock(PRODUCTION_URL).post('/').reply(200, {})

      const responses = await testDestination.testAction('track', {
        settings,
        event: createTestEvent({
          type: 'track',
          event: 'Signed Up',
          userId: '583',
          timestamp,
          properties: { a: null, b: '' }
        }),
        useDefaultMappings: true
      })

      expect(responses[0].options.json).not.toHaveProperty('properties')
    })

    it('sends only the email in identify traits when other traits are empty', async () => {
      nock(PRODUCTION_URL).post('/').reply(200, {})

      const responses = await testDestination.testAction('identify', {
        settings,
        event: createTestEvent({
          type: 'identify',
          userId: '583',
          anonymousId: undefined,
          timestamp,
          traits: { email: 'a@b.com', name: null, plan: '' }
        }),
        useDefaultMappings: true
      })

      const json = responses[0].options.json as Record<string, unknown>
      expect(json.traits).toEqual({ email: 'a@b.com' })
      expect(json).not.toHaveProperty('anonymousId')
    })

    it('omits empty group traits', async () => {
      nock(PRODUCTION_URL).post('/').reply(200, {})

      const responses = await testDestination.testAction('group', {
        settings,
        event: createTestEvent({
          type: 'group',
          userId: '583',
          groupId: 'group-1',
          timestamp,
          traits: { name: '' }
        }),
        useDefaultMappings: true
      })

      expect(responses[0].options.json).not.toHaveProperty('traits')
    })
  })

  describe('environment', () => {
    it('posts to the testing URL when the testing environment is selected', async () => {
      nock(TESTING_URL).post('/').reply(200, {})

      const responses = await testDestination.testAction('track', {
        settings: { ...settings, environment: 'testing' },
        event: createTestEvent({ type: 'track', event: 'Signed Up', userId: '583', timestamp }),
        useDefaultMappings: true
      })

      expect(responses[0].url).toBe(TESTING_URL)
    })
  })
})
