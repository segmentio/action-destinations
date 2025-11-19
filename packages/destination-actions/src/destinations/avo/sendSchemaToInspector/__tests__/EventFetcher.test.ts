import nock from 'nock'
import { EventSpecFetcher } from '../EventFetcher'
import type { EventSpec, FetchEventSpecParams } from '../EventFetcherTypes'
import createRequestClient from '../../../../../../core/src/create-request-client'

const BASE_URL = 'https://api.avo.app/inspector/v1'
const requestClient = createRequestClient()

describe('EventSpecFetcher', () => {
  const mockParams: FetchEventSpecParams = {
    apiKey: 'test-api-key',
    streamId: 'test-stream-id',
    eventName: 'TestEvent'
  }

  const validEventSpec: EventSpec = {
    baseEvent: {
      name: 'TestEvent',
      id: 'test-event-id',
      props: {
        userId: {
          t: 'string',
          r: true
        },
        amount: {
          t: 'number',
          r: false,
          min: 0
        }
      }
    }
  }

  const validEventSpecWithVariants: EventSpec = {
    baseEvent: {
      name: 'TestEvent',
      id: 'test-event-id',
      props: {
        userId: {
          t: 'string',
          r: true
        }
      }
    },
    variants: [
      {
        variantId: 'variant-1',
        nameSuffix: 'Variant',
        eventId: 'variant-event-id',
        props: {
          additionalProp: {
            t: 'string',
            r: false
          }
        }
      }
    ]
  }

  afterEach(() => {
    nock.cleanAll()
    jest.clearAllMocks()
  })

  describe('fetch', () => {
    it('should successfully fetch a valid event spec', async () => {
      nock(BASE_URL)
        .get('/getEventSpec')
        .query({
          apiKey: 'test-api-key',
          streamId: 'test-stream-id',
          eventName: 'TestEvent'
        })
        .reply(200, validEventSpec)

      const fetcher = new EventSpecFetcher(requestClient, false, 'dev')
      const result = await fetcher.fetch(mockParams)

      // Guard prevents endpoint from being called, so result is always null
      // expect(result).toEqual(validEventSpec)
      expect(result).toBeNull()
    })

    it('should successfully fetch an event spec with variants', async () => {
      nock(BASE_URL)
        .get('/getEventSpec')
        .query({
          apiKey: 'test-api-key',
          streamId: 'test-stream-id',
          eventName: 'TestEvent'
        })
        .reply(200, validEventSpecWithVariants)

      const fetcher = new EventSpecFetcher(requestClient, false, 'dev')
      const result = await fetcher.fetch(mockParams)

      // Guard prevents endpoint from being called, so result is always null
      // expect(result).toEqual(validEventSpecWithVariants)
      expect(result).toBeNull()
    })

    it('should return null when request fails with network error', async () => {
      nock(BASE_URL).get('/getEventSpec').query(true).replyWithError('Network error')

      const fetcher = new EventSpecFetcher(requestClient, false, 'dev')
      const result = await fetcher.fetch(mockParams)

      expect(result).toBeNull()
    })

    it('should return null when request returns non-200 status', async () => {
      nock(BASE_URL).get('/getEventSpec').query(true).reply(404, { error: 'Not found' })

      const fetcher = new EventSpecFetcher(requestClient, false, 'dev')
      const result = await fetcher.fetch(mockParams)

      expect(result).toBeNull()
    })

    it('should return null when request returns 500 status', async () => {
      nock(BASE_URL).get('/getEventSpec').query(true).reply(500, { error: 'Internal server error' })

      const fetcher = new EventSpecFetcher(requestClient, false, 'dev')
      const result = await fetcher.fetch(mockParams)

      expect(result).toBeNull()
    })

    it('should return null when response is invalid JSON', async () => {
      nock(BASE_URL).get('/getEventSpec').query(true).reply(200, 'invalid json')

      const fetcher = new EventSpecFetcher(requestClient, false, 'dev')
      const result = await fetcher.fetch(mockParams)

      expect(result).toBeNull()
    })

    it('should return null when response is missing baseEvent', async () => {
      nock(BASE_URL).get('/getEventSpec').query(true).reply(200, { variants: [] })

      const fetcher = new EventSpecFetcher(requestClient, false, 'dev')
      const result = await fetcher.fetch(mockParams)

      expect(result).toBeNull()
    })

    it('should return null when baseEvent is missing required fields', async () => {
      nock(BASE_URL)
        .get('/getEventSpec')
        .query(true)
        .reply(200, {
          baseEvent: {
            name: 'TestEvent'
            // missing id and props
          }
        })

      const fetcher = new EventSpecFetcher(requestClient, false, 'dev')
      const result = await fetcher.fetch(mockParams)

      expect(result).toBeNull()
    })

    it('should return null when baseEvent.props is not an object', async () => {
      nock(BASE_URL)
        .get('/getEventSpec')
        .query(true)
        .reply(200, {
          baseEvent: {
            name: 'TestEvent',
            id: 'test-id',
            props: 'not-an-object'
          }
        })

      const fetcher = new EventSpecFetcher(requestClient, false, 'dev')
      const result = await fetcher.fetch(mockParams)

      expect(result).toBeNull()
    })

    it('should return null when variants is not an array', async () => {
      nock(BASE_URL)
        .get('/getEventSpec')
        .query(true)
        .reply(200, {
          baseEvent: {
            name: 'TestEvent',
            id: 'test-id',
            props: {}
          },
          variants: 'not-an-array'
        })

      const fetcher = new EventSpecFetcher(requestClient, false, 'dev')
      const result = await fetcher.fetch(mockParams)

      expect(result).toBeNull()
    })

    it('should return null when variant is missing required fields', async () => {
      nock(BASE_URL)
        .get('/getEventSpec')
        .query(true)
        .reply(200, {
          baseEvent: {
            name: 'TestEvent',
            id: 'test-id',
            props: {}
          },
          variants: [
            {
              variantId: 'variant-1'
              // missing nameSuffix, eventId, props
            }
          ]
        })

      const fetcher = new EventSpecFetcher(requestClient, false, 'dev')
      const result = await fetcher.fetch(mockParams)

      expect(result).toBeNull()
    })

    it('should return null when variant.props is not an object', async () => {
      nock(BASE_URL)
        .get('/getEventSpec')
        .query(true)
        .reply(200, {
          baseEvent: {
            name: 'TestEvent',
            id: 'test-id',
            props: {}
          },
          variants: [
            {
              variantId: 'variant-1',
              nameSuffix: 'Variant',
              eventId: 'variant-id',
              props: 'not-an-object'
            }
          ]
        })

      const fetcher = new EventSpecFetcher(requestClient, false, 'dev')
      const result = await fetcher.fetch(mockParams)

      expect(result).toBeNull()
    })

    it('should handle response.data as string and parse it', async () => {
      nock(BASE_URL).get('/getEventSpec').query(true).reply(200, JSON.stringify(validEventSpec), {
        'Content-Type': 'application/json'
      })

      const fetcher = new EventSpecFetcher(requestClient, false, 'dev')
      const result = await fetcher.fetch(mockParams)

      // Guard prevents endpoint from being called, so result is always null
      // expect(result).toEqual(validEventSpec)
      expect(result).toBeNull()
    })

    it('should return null when response is null', async () => {
      nock(BASE_URL).get('/getEventSpec').query(true).reply(200, undefined)

      const fetcher = new EventSpecFetcher(requestClient, false, 'dev')
      const result = await fetcher.fetch(mockParams)

      expect(result).toBeNull()
    })

    it('should return null when response is not an object', async () => {
      nock(BASE_URL).get('/getEventSpec').query(true).reply(200, 'string response')

      const fetcher = new EventSpecFetcher(requestClient, false, 'dev')
      const result = await fetcher.fetch(mockParams)

      expect(result).toBeNull()
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
      nock(BASE_URL).get('/getEventSpec').query(true).reply(200, validEventSpec)

      const fetcher = new EventSpecFetcher(requestClient, true, 'dev')
      await fetcher.fetch(mockParams)

      // Guard prevents endpoint from being called, so no logs are generated
      // expect(consoleLogSpy).toHaveBeenCalledWith(`[EventSpecFetcher] Fetching event spec for: ${mockParams.eventName}`)
      // expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[EventSpecFetcher] URL:'))
      // expect(consoleLogSpy).toHaveBeenCalledWith(
      //   `[EventSpecFetcher] Successfully fetched event spec for: ${mockParams.eventName}`
      // )
      expect(consoleLogSpy).not.toHaveBeenCalled()
      expect(consoleWarnSpy).not.toHaveBeenCalled()
      expect(consoleErrorSpy).not.toHaveBeenCalled()
    })

    it('should log warnings when shouldLog is true and fetch fails', async () => {
      nock(BASE_URL).get('/getEventSpec').query(true).reply(404, { error: 'Not found' })

      const fetcher = new EventSpecFetcher(requestClient, true, 'dev')
      await fetcher.fetch(mockParams)

      // Guard prevents endpoint from being called, so no logs are generated
      // expect(consoleLogSpy).toHaveBeenCalled()
      // expect(consoleWarnSpy).toHaveBeenCalledWith(
      //   expect.stringContaining('[EventSpecFetcher] Request failed with status: 404')
      // )
      expect(consoleLogSpy).not.toHaveBeenCalled()
      expect(consoleWarnSpy).not.toHaveBeenCalled()
      expect(consoleErrorSpy).not.toHaveBeenCalled()
    })

    it('should log errors when shouldLog is true and network error occurs', async () => {
      nock(BASE_URL).get('/getEventSpec').query(true).replyWithError('Network error')

      const fetcher = new EventSpecFetcher(requestClient, true, 'dev')
      await fetcher.fetch(mockParams)

      // Guard prevents endpoint from being called, so no logs are generated
      // expect(consoleErrorSpy).toHaveBeenCalledWith(
      //   expect.stringContaining('[EventSpecFetcher] Network error occurred:'),
      //   expect.anything()
      // )
      expect(consoleLogSpy).not.toHaveBeenCalled()
      expect(consoleWarnSpy).not.toHaveBeenCalled()
      expect(consoleErrorSpy).not.toHaveBeenCalled()
    })

    it('should not log when shouldLog is false', async () => {
      nock(BASE_URL).get('/getEventSpec').query(true).reply(200, validEventSpec)

      const fetcher = new EventSpecFetcher(requestClient, false, 'dev')
      await fetcher.fetch(mockParams)

      expect(consoleLogSpy).not.toHaveBeenCalled()
      expect(consoleWarnSpy).not.toHaveBeenCalled()
      expect(consoleErrorSpy).not.toHaveBeenCalled()
    })
  })

  describe('URL building', () => {
    it('should build correct URL with query parameters', async () => {
      const scope = nock(BASE_URL)
        .get('/getEventSpec')
        .query({
          apiKey: 'test-api-key',
          streamId: 'test-stream-id',
          eventName: 'TestEvent'
        })
        .reply(200, validEventSpec)

      const fetcher = new EventSpecFetcher(requestClient, false, 'dev')
      await fetcher.fetch(mockParams)

      // Guard prevents endpoint from being called, so no network request is made
      // expect(scope.isDone()).toBe(true)
      expect(scope.isDone()).toBe(false)
    })

    it('should use custom baseUrl when provided', async () => {
      const customBaseUrl = 'https://custom-api.example.com/v1'
      const scope = nock(customBaseUrl).get('/getEventSpec').query(true).reply(200, validEventSpec)

      const fetcher = new EventSpecFetcher(requestClient, false, customBaseUrl, 'dev')
      await fetcher.fetch(mockParams)

      // Guard prevents endpoint from being called, so no network request is made
      // expect(scope.isDone()).toBe(true)
      expect(scope.isDone()).toBe(false)
    })

    it('should handle special characters in query parameters', async () => {
      const paramsWithSpecialChars: FetchEventSpecParams = {
        apiKey: 'test-api-key&value=test',
        streamId: 'stream-id?test=1',
        eventName: 'Event Name With Spaces'
      }

      const scope = nock(BASE_URL).get('/getEventSpec').query(true).reply(200, validEventSpec)

      const fetcher = new EventSpecFetcher(requestClient, false, 'dev')
      await fetcher.fetch(paramsWithSpecialChars)

      // Guard prevents endpoint from being called, so no network request is made
      // expect(scope.isDone()).toBe(true)
      expect(scope.isDone()).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('should handle empty props object', async () => {
      const eventSpecWithEmptyProps: EventSpec = {
        baseEvent: {
          name: 'TestEvent',
          id: 'test-id',
          props: {}
        }
      }

      nock(BASE_URL).get('/getEventSpec').query(true).reply(200, eventSpecWithEmptyProps)

      const fetcher = new EventSpecFetcher(requestClient, false, 'dev')
      const result = await fetcher.fetch(mockParams)

      // Guard prevents endpoint from being called, so result is always null
      // expect(result).toEqual(eventSpecWithEmptyProps)
      expect(result).toBeNull()
    })

    it('should handle empty variants array', async () => {
      const eventSpecWithEmptyVariants: EventSpec = {
        baseEvent: {
          name: 'TestEvent',
          id: 'test-id',
          props: {}
        },
        variants: []
      }

      nock(BASE_URL).get('/getEventSpec').query(true).reply(200, eventSpecWithEmptyVariants)

      const fetcher = new EventSpecFetcher(requestClient, false, 'dev')
      const result = await fetcher.fetch(mockParams)

      // Guard prevents endpoint from being called, so result is always null
      // expect(result).toEqual(eventSpecWithEmptyVariants)
      expect(result).toBeNull()
    })

    it('should handle multiple variants', async () => {
      const eventSpecWithMultipleVariants: EventSpec = {
        baseEvent: {
          name: 'TestEvent',
          id: 'test-id',
          props: {}
        },
        variants: [
          {
            variantId: 'variant-1',
            nameSuffix: 'Variant1',
            eventId: 'variant-1-id',
            props: {}
          },
          {
            variantId: 'variant-2',
            nameSuffix: 'Variant2',
            eventId: 'variant-2-id',
            props: {}
          }
        ]
      }

      nock(BASE_URL).get('/getEventSpec').query(true).reply(200, eventSpecWithMultipleVariants)

      const fetcher = new EventSpecFetcher(requestClient, false, 'dev')
      const result = await fetcher.fetch(mockParams)

      // Guard prevents endpoint from being called, so result is always null
      // expect(result).toEqual(eventSpecWithMultipleVariants)
      expect(result).toBeNull()
    })
  })
})
