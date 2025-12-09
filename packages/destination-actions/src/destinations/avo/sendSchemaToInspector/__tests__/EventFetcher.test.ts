import nock from 'nock'
import { EventSpecFetcher } from '../eventSpec/EventFetcher'
import type { EventSpecResponseWire, FetchEventSpecParams } from '../eventSpec/EventFetcherTypes'
import createRequestClient from '../../../../../../core/src/create-request-client'

const BASE_URL = 'https://api.avo.app'
const requestClient = createRequestClient()

describe('EventSpecFetcher', () => {
  const mockParams: FetchEventSpecParams = {
    apiKey: 'test-api-key',
    streamId: 'test-stream-id',
    eventName: 'TestEvent'
  }

  const validWireResponse: EventSpecResponseWire = {
    events: [
      {
        b: 'main',
        id: 'test-event-id',
        vids: [],
        p: {
          userId: { t: 'string', r: true },
          amount: { t: 'number', r: false, min: 0 }
        }
      }
    ],
    metadata: {
      schemaId: 'test-schema-id',
      branchId: 'main',
      latestActionId: 'test-action-id',
      sourceId: 'test-source-id'
    }
  }

  const validWireResponseWithVariants: EventSpecResponseWire = {
    events: [
      {
        b: 'main',
        id: 'test-event-id',
        vids: ['variant-event-id'],
        p: {
          userId: { t: 'string', r: true },
          additionalProp: { t: 'string', r: false }
        }
      }
    ],
    metadata: {
      schemaId: 'test-schema-id',
      branchId: 'main',
      latestActionId: 'test-action-id',
      sourceId: 'test-source-id'
    }
  }

  afterEach(() => {
    nock.cleanAll()
    jest.clearAllMocks()
  })

  describe('fetch', () => {
    it('should successfully fetch a valid event spec', async () => {
      nock(BASE_URL)
        .get('/trackingPlan/eventSpec')
        .query({
          apiKey: 'test-api-key',
          streamId: 'test-stream-id',
          eventName: 'TestEvent'
        })
        .reply(200, validWireResponse)

      const fetcher = new EventSpecFetcher(requestClient, false, 'dev')
      const result = await fetcher.fetch(mockParams)

      expect(result).not.toBeNull()
      expect(result?.events[0].baseEventId).toBe('test-event-id')
      expect(result?.events[0].props.userId.type).toBe('string')
    })

    it('should successfully fetch an event spec with variants', async () => {
      nock(BASE_URL).get('/trackingPlan/eventSpec').query(true).reply(200, validWireResponseWithVariants)

      const fetcher = new EventSpecFetcher(requestClient, false, 'dev')
      const result = await fetcher.fetch(mockParams)

      expect(result).not.toBeNull()
      expect(result?.events[0].variantIds).toContain('variant-event-id')
      expect(result?.events[0].props.additionalProp).toBeDefined()
    })

    it('should return null when request fails with network error', async () => {
      nock(BASE_URL).get('/trackingPlan/eventSpec').query(true).replyWithError('Network error')

      const fetcher = new EventSpecFetcher(requestClient, false, 'dev')
      const result = await fetcher.fetch(mockParams)

      expect(result).toBeNull()
    })

    it('should return null when request returns non-200 status', async () => {
      nock(BASE_URL).get('/trackingPlan/eventSpec').query(true).reply(404, { error: 'Not found' })

      const fetcher = new EventSpecFetcher(requestClient, false, 'dev')
      const result = await fetcher.fetch(mockParams)

      expect(result).toBeNull()
    })

    it('should return null when response is invalid JSON', async () => {
      nock(BASE_URL).get('/trackingPlan/eventSpec').query(true).reply(200, 'invalid json')

      const fetcher = new EventSpecFetcher(requestClient, false, 'dev')
      const result = await fetcher.fetch(mockParams)

      expect(result).toBeNull()
    })

    it('should return null when response is missing events array', async () => {
      nock(BASE_URL).get('/trackingPlan/eventSpec').query(true).reply(200, { metadata: {} })

      const fetcher = new EventSpecFetcher(requestClient, false, 'dev')
      const result = await fetcher.fetch(mockParams)

      expect(result).toBeNull()
    })

    it('should deduplicate in-flight requests', async () => {
      const scope = nock(BASE_URL)
        .get('/trackingPlan/eventSpec')
        .query(true)
        .delay(50) // Simulate network delay
        .reply(200, validWireResponse)

      const fetcher = new EventSpecFetcher(requestClient, false, 'dev')

      // Fire two requests simultaneously
      const promise1 = fetcher.fetch(mockParams)
      const promise2 = fetcher.fetch(mockParams)

      const [result1, result2] = await Promise.all([promise1, promise2])

      // Should be the exact same object reference
      expect(result1).toBe(result2)
      expect(result1).not.toBeNull()
      // Nock should have been called only once
      expect(scope.isDone()).toBe(true)
    })

    it('should NOT deduplicate in-flight requests with different API keys', async () => {
      const scope = nock(BASE_URL)
        .get('/trackingPlan/eventSpec')
        .query((q) => q.apiKey === 'key1')
        .delay(50)
        .reply(200, validWireResponse)
        .get('/trackingPlan/eventSpec')
        .query((q) => q.apiKey === 'key2')
        .delay(50)
        .reply(200, validWireResponse)

      const fetcher = new EventSpecFetcher(requestClient, false, 'dev')

      const params1 = { ...mockParams, apiKey: 'key1' }
      const params2 = { ...mockParams, apiKey: 'key2' }

      const promise1 = fetcher.fetch(params1)
      const promise2 = fetcher.fetch(params2)

      const [result1, result2] = await Promise.all([promise1, promise2])

      // Should be different object references (since they are different requests)
      expect(result1).not.toBe(result2)
      expect(result1).not.toBeNull()
      expect(result2).not.toBeNull()
      // Nock should have been called twice (once for each key)
      expect(scope.isDone()).toBe(true)
    })
  })

  describe('logging', () => {
    let consoleLogSpy: jest.SpyInstance
    let consoleWarnSpy: jest.SpyInstance
    let consoleErrorSpy: jest.SpyInstance

    beforeEach(() => {
      consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()
      consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    })

    afterEach(() => {
      consoleLogSpy.mockRestore()
      consoleWarnSpy.mockRestore()
      consoleErrorSpy.mockRestore()
    })

    it('should log when shouldLog is true and fetch succeeds', async () => {
      nock(BASE_URL).get('/trackingPlan/eventSpec').query(true).reply(200, validWireResponse)

      const fetcher = new EventSpecFetcher(requestClient, true, 'dev')
      await fetcher.fetch(mockParams)

      expect(consoleLogSpy).toHaveBeenCalledWith(`[EventSpecFetcher] Fetching event spec for: ${mockParams.eventName}`)
    })

    it('should not log when shouldLog is false', async () => {
      nock(BASE_URL).get('/trackingPlan/eventSpec').query(true).reply(200, validWireResponse)

      const fetcher = new EventSpecFetcher(requestClient, false, 'dev')
      await fetcher.fetch(mockParams)

      expect(consoleLogSpy).not.toHaveBeenCalled()
    })
  })
})
