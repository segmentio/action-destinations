import nock from 'nock'
import { extractSchemaFromEvent } from '../avo'
import type { Payload } from '../generated-types'
import type { EventSpecResponseWire } from '../eventSpec/EventFetcherTypes'
import createRequestClient from '../../../../../../core/src/create-request-client'

const requestClient = createRequestClient()
const BASE_URL = 'https://api.avo.app'

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

  const validWireResponse: EventSpecResponseWire = {
    branchId: 'main',
    baseEvent: {
      id: 'test-event-id',
      name: 'TestEvent',
      props: {
        userId: { t: 'string', r: true },
        amount: { t: 'number', r: false }
      }
    },
    variants: []
  }

  afterEach(() => {
    nock.cleanAll()
    jest.clearAllMocks()
  })

  it('should fetch event spec and return event body', async () => {
    nock(BASE_URL)
      .get('/trackingPlan/eventSpec')
      .query({
        apiKey: 'test-api-key',
        streamId: 'test-stream-id',
        eventName: 'TestEvent'
      })
      .reply(200, validWireResponse)

    const result = await extractSchemaFromEvent(mockEvent, undefined, 'test-api-key', 'dev', undefined, requestClient)

    expect(result).toBeDefined()
    expect(result.eventName).toBe('TestEvent')
    expect(result.type).toBe('event')
    expect(result.messageId).toBe('test-message-id')
  })

  it('should handle missing apiKey gracefully', async () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()

    const result = await extractSchemaFromEvent(mockEvent, undefined, '', 'dev', undefined, requestClient)

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

    const result = await extractSchemaFromEvent(
      eventWithoutStreamId,
      undefined,
      'test-api-key',
      'dev',
      undefined,
      requestClient
    )

    expect(result).toBeDefined()
    expect(result.eventName).toBe('TestEvent')
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('[Avo Inspector] streamId is missing'))

    consoleWarnSpy.mockRestore()
  })

  it('should handle event spec fetch failure gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    nock(BASE_URL).get('/trackingPlan/eventSpec').query(true).reply(500, { error: 'Internal server error' })

    const result = await extractSchemaFromEvent(mockEvent, undefined, 'test-api-key', 'dev', undefined, requestClient)

    expect(result).toBeDefined()
    expect(result.eventName).toBe('TestEvent')
    // Should still return event body even if spec fetch fails
    expect(result.type).toBe('event')

    consoleErrorSpy.mockRestore()
  })

  it('should handle network error during event spec fetch', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    nock(BASE_URL).get('/trackingPlan/eventSpec').query(true).replyWithError('Network error')

    const result = await extractSchemaFromEvent(mockEvent, undefined, 'test-api-key', 'dev', undefined, requestClient)

    expect(result).toBeDefined()
    expect(result.eventName).toBe('TestEvent')
    expect(result.type).toBe('event')

    consoleErrorSpy.mockRestore()
  })

  it('should handle invalid event spec response', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    nock(BASE_URL).get('/trackingPlan/eventSpec').query(true).reply(200, { invalid: 'response' })

    const result = await extractSchemaFromEvent(mockEvent, undefined, 'test-api-key', 'dev', undefined, requestClient)

    expect(result).toBeDefined()
    expect(result.eventName).toBe('TestEvent')
    expect(result.type).toBe('event')

    consoleErrorSpy.mockRestore()
  })

  it('should work with appVersionPropertyName', async () => {
    nock(BASE_URL).get('/trackingPlan/eventSpec').query(true).reply(200, validWireResponse)

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
      undefined,
      requestClient
    )

    expect(result).toBeDefined()
    expect(result.appVersion).toBe('2.0.0')
  })

  it('should handle events without properties', async () => {
    nock(BASE_URL).get('/trackingPlan/eventSpec').query(true).reply(200, validWireResponse)

    const eventWithoutProperties: Payload = {
      ...mockEvent,
      properties: {}
    }

    const result = await extractSchemaFromEvent(
      eventWithoutProperties,
      undefined,
      'test-api-key',
      'dev',
      undefined,
      requestClient
    )

    expect(result).toBeDefined()
    expect(result.eventName).toBe('TestEvent')
    expect(result.eventProperties).toEqual([])
  })

  it('should handle events with pageUrl for appName extraction', async () => {
    nock(BASE_URL).get('/trackingPlan/eventSpec').query(true).reply(200, validWireResponse)

    const eventWithPageUrl: Payload = {
      ...mockEvent,
      pageUrl: 'https://example.com/page'
    }

    const result = await extractSchemaFromEvent(
      eventWithPageUrl,
      undefined,
      'test-api-key',
      'dev',
      undefined,
      requestClient
    )

    expect(result).toBeDefined()
    expect(result.appName).toBe('example.com')
  })

  it('should use default appName when not provided', async () => {
    nock(BASE_URL).get('/trackingPlan/eventSpec').query(true).reply(200, validWireResponse)

    const eventWithoutAppName: Payload = {
      ...mockEvent,
      appName: undefined,
      pageUrl: undefined
    }

    const result = await extractSchemaFromEvent(
      eventWithoutAppName,
      undefined,
      'test-api-key',
      'dev',
      undefined,
      requestClient
    )

    expect(result).toBeDefined()
    expect(result.appName).toBe('unnamed Segment app')
  })

  it('should use default appVersion when not provided', async () => {
    nock(BASE_URL).get('/trackingPlan/eventSpec').query(true).reply(200, validWireResponse)

    const eventWithoutAppVersion: Payload = {
      ...mockEvent,
      appVersion: undefined
    }

    const result = await extractSchemaFromEvent(
      eventWithoutAppVersion,
      undefined,
      'test-api-key',
      'dev',
      undefined,
      requestClient
    )

    expect(result).toBeDefined()
    expect(result.appVersion).toBe('unversioned')
  })
})
