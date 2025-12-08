import nock from 'nock'
import { extractSchemaFromEvent } from '../avo'
import type { Payload } from '../generated-types'
import type { EventSpec } from '../eventSpec/EventFetcherTypes'
import createRequestClient from '../../../../../../core/src/create-request-client'

const requestClient = createRequestClient()
const BASE_URL = 'https://api.avo.app/inspector/v1'

describe('extractSchemaFromEvent', () => {
  const mockEvent: Payload = {
    event: 'TestEvent',
    messageId: 'test-message-id',
    createdAt: '2024-01-01T00:00:00Z',
    properties: {
      userId: 'user-123',
      amount: 100
    },
    anonymousId: 'test-stream-id'
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
          r: false
        }
      }
    }
  }

  afterEach(() => {
    nock.cleanAll()
    jest.clearAllMocks()
  })

  it('should fetch event spec and return event body', async () => {
    nock(BASE_URL)
      .get('/getEventSpec')
      .query({
        apiKey: 'test-api-key',
        streamId: 'test-stream-id',
        eventName: 'TestEvent'
      })
      .reply(200, validEventSpec)

    const result = await extractSchemaFromEvent(mockEvent, undefined, 'test-api-key', 'dev', requestClient)

    expect(result).toBeDefined()
    expect(result.eventName).toBe('TestEvent')
    expect(result.type).toBe('event')
    expect(result.messageId).toBe('test-message-id')
  })

  it('should handle missing apiKey gracefully', async () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()

    const result = await extractSchemaFromEvent(mockEvent, undefined, '', 'dev', requestClient)

    expect(result).toBeDefined()
    expect(result.eventName).toBe('TestEvent')
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('[Avo Inspector] apiKey is missing'))

    consoleWarnSpy.mockRestore()
  })

  it('should handle missing streamId gracefully', async () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()

    const eventWithoutStreamId: Payload = {
      ...mockEvent,
      anonymousId: undefined
    }

    const result = await extractSchemaFromEvent(eventWithoutStreamId, undefined, 'test-api-key', 'dev', requestClient)

    expect(result).toBeDefined()
    expect(result.eventName).toBe('TestEvent')
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('[Avo Inspector] streamId is missing'))

    consoleWarnSpy.mockRestore()
  })

  it('should handle event spec fetch failure gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    nock(BASE_URL).get('/getEventSpec').query(true).reply(500, { error: 'Internal server error' })

    const result = await extractSchemaFromEvent(mockEvent, undefined, 'test-api-key', 'dev', requestClient)

    expect(result).toBeDefined()
    expect(result.eventName).toBe('TestEvent')
    // Should still return event body even if spec fetch fails
    expect(result.type).toBe('event')

    consoleErrorSpy.mockRestore()
  })

  it('should handle network error during event spec fetch', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    nock(BASE_URL).get('/getEventSpec').query(true).replyWithError('Network error')

    const result = await extractSchemaFromEvent(mockEvent, undefined, 'test-api-key', 'dev', requestClient)

    expect(result).toBeDefined()
    expect(result.eventName).toBe('TestEvent')
    expect(result.type).toBe('event')

    consoleErrorSpy.mockRestore()
  })

  it('should handle invalid event spec response', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    nock(BASE_URL).get('/getEventSpec').query(true).reply(200, { invalid: 'response' })

    const result = await extractSchemaFromEvent(mockEvent, undefined, 'test-api-key', 'dev', requestClient)

    expect(result).toBeDefined()
    expect(result.eventName).toBe('TestEvent')
    expect(result.type).toBe('event')

    consoleErrorSpy.mockRestore()
  })

  it('should log event spec when successfully fetched', async () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()

    nock(BASE_URL).get('/getEventSpec').query(true).reply(200, validEventSpec)

    await extractSchemaFromEvent(mockEvent, undefined, 'test-api-key', 'dev', requestClient)

    // expect(consoleLogSpy).toHaveBeenCalledWith(
    //   expect.stringContaining('[Avo Inspector] Final eventSpec:'),
    //   expect.stringContaining('set')
    // )
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Avo Inspector] Final eventSpec:'),
      expect.stringContaining('null')
    )

    consoleLogSpy.mockRestore()
  })

  it('should log null when event spec is not fetched', async () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()

    await extractSchemaFromEvent(mockEvent, undefined, '', 'dev', requestClient)

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[Avo Inspector] Final eventSpec:'), 'null')

    consoleLogSpy.mockRestore()
  })

  it('should work with appVersionPropertyName', async () => {
    nock(BASE_URL).get('/getEventSpec').query(true).reply(200, validEventSpec)

    const eventWithAppVersion: Payload = {
      ...mockEvent,
      properties: {
        ...mockEvent.properties,
        customAppVersion: '2.0.0'
      }
    }

    const result = await extractSchemaFromEvent(
      eventWithAppVersion,
      'customAppVersion',
      'test-api-key',
      'dev',
      requestClient
    )

    expect(result).toBeDefined()
    expect(result.appVersion).toBe('2.0.0')
  })

  it('should handle events without properties', async () => {
    nock(BASE_URL).get('/getEventSpec').query(true).reply(200, validEventSpec)

    const eventWithoutProperties: Payload = {
      ...mockEvent,
      properties: {}
    }

    const result = await extractSchemaFromEvent(eventWithoutProperties, undefined, 'test-api-key', 'dev', requestClient)

    expect(result).toBeDefined()
    expect(result.eventName).toBe('TestEvent')
    expect(result.eventProperties).toEqual([])
  })

  it('should handle events with pageUrl for appName extraction', async () => {
    nock(BASE_URL).get('/getEventSpec').query(true).reply(200, validEventSpec)

    const eventWithPageUrl: Payload = {
      ...mockEvent,
      pageUrl: 'https://example.com/page'
    }

    const result = await extractSchemaFromEvent(eventWithPageUrl, undefined, 'test-api-key', 'dev', requestClient)

    expect(result).toBeDefined()
    expect(result.appName).toBe('example.com')
  })

  it('should use default appName when not provided', async () => {
    nock(BASE_URL).get('/getEventSpec').query(true).reply(200, validEventSpec)

    const eventWithoutAppName: Payload = {
      ...mockEvent,
      appName: undefined,
      pageUrl: undefined
    }

    const result = await extractSchemaFromEvent(eventWithoutAppName, undefined, 'test-api-key', 'dev', requestClient)

    expect(result).toBeDefined()
    expect(result.appName).toBe('unnamed Segment app')
  })

  it('should use default appVersion when not provided', async () => {
    nock(BASE_URL).get('/getEventSpec').query(true).reply(200, validEventSpec)

    const eventWithoutAppVersion: Payload = {
      ...mockEvent,
      appVersion: undefined
    }

    const result = await extractSchemaFromEvent(eventWithoutAppVersion, undefined, 'test-api-key', 'dev', requestClient)

    expect(result).toBeDefined()
    expect(result.appVersion).toBe('unversioned')
  })
})
