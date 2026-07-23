import { send } from '../functions/functions'
import type { Payload } from '../generated-types'
import type { EventSchemaBody, EventSpecResponseWire } from '../types'
import type { Settings } from '../../generated-types'
import type { RequestClient } from '@segment/actions-core'

describe('send', () => {
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

  const baseSettings: Settings = {
    apiKey: 'test-api-key',
    env: 'prod'
  }

  const validEventSpecResponse: EventSpecResponseWire = {
    events: [
      {
        b: 'main',
        id: 'test-event-id',
        vids: [],
        p: {
          userId: { t: 'string', r: true }
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

  const createRequestMock = (eventSpecResponse?: EventSpecResponseWire) => {
    let postUrl: string | undefined
    let postOptions: { json?: unknown } | undefined
    const request = jest.fn().mockImplementation((url: string, options: { method?: string; json?: unknown }) => {
      if (options?.method === 'GET') {
        return Promise.resolve({
          data:
            eventSpecResponse ??
            ({
              events: [],
              metadata: {
                schemaId: 'empty',
                branchId: 'main',
                latestActionId: 'action-id'
              }
            } as EventSpecResponseWire)
        })
      }

      if (options?.method === 'post') {
        postUrl = url
        postOptions = options
        return Promise.resolve({ data: {} })
      }

      throw new Error(`Unexpected request: ${String(options?.method)} ${url}`)
    }) as unknown as RequestClient

    return {
      request,
      getPostedEvent: () => (postOptions?.json as EventSchemaBody[] | undefined)?.[0],
      getPostUrl: () => postUrl
    }
  }

  it('should send event body with validation when eventSpec is provided', async () => {
    const { request, getPostedEvent, getPostUrl } = createRequestMock(validEventSpecResponse)

    await send(request, { ...baseSettings, env: 'dev' }, [mockEvent])

    const result = getPostedEvent()
    if (!result) {
      throw new Error('No event was posted')
    }

    expect(result).toBeDefined()
    expect(result.eventName).toBe('TestEvent')
    expect(result.type).toBe('event')
    expect(result.messageId).toBe('test-message-id')
    // Should include validation metadata when spec is provided
    expect(result.eventSpecMetadata).toBeDefined()
    expect(getPostUrl()).toBe('https://api.avo.app/inspector/segment/v1/track')
  })

  it('should send event body without validation when env is not dev/staging', async () => {
    const { request, getPostedEvent } = createRequestMock()

    await send(request, baseSettings, [mockEvent])

    const result = getPostedEvent()
    if (!result) {
      throw new Error('No event was posted')
    }

    expect(result).toBeDefined()
    expect(result.eventName).toBe('TestEvent')
    expect(result.type).toBe('event')
    expect(result.messageId).toBe('test-message-id')
    // Should not include validation metadata when spec is null
    expect(result.eventSpecMetadata).toBeUndefined()
  })

  it('should work with appVersionPropertyName', async () => {
    const eventWithAppVersion: Payload = {
      ...mockEvent,
      properties: {
        ...mockEvent.properties,
        customAppVersion: '2.0.0'
      }
    }

    const { request, getPostedEvent } = createRequestMock()

    await send(request, { ...baseSettings, appVersionPropertyName: 'customAppVersion' }, [eventWithAppVersion])

    const result = getPostedEvent()
    if (!result) {
      throw new Error('No event was posted')
    }
    expect(result).toBeDefined()
    expect(result.appVersion).toBe('2.0.0')
  })

  it('should handle events without properties', async () => {
    const eventWithoutProperties: Payload = {
      ...mockEvent,
      properties: {}
    }

    const { request, getPostedEvent } = createRequestMock()

    await send(request, baseSettings, [eventWithoutProperties])

    const result = getPostedEvent()
    if (!result) {
      throw new Error('No event was posted')
    }

    expect(result).toBeDefined()
    expect(result.eventName).toBe('TestEvent')
    expect(result.eventProperties).toEqual([])
  })

  it('should handle events with pageUrl for appName extraction', async () => {
    const eventWithPageUrl: Payload = {
      ...mockEvent,
      pageUrl: 'https://example.com/page'
    }

    const { request, getPostedEvent } = createRequestMock()

    await send(request, baseSettings, [eventWithPageUrl])

    const result = getPostedEvent()
    if (!result) {
      throw new Error('No event was posted')
    }

    expect(result).toBeDefined()
    expect(result.appName).toBe('example.com')
  })

  it('should use default appName when not provided', async () => {
    const eventWithoutAppName: Payload = {
      ...mockEvent,
      appName: undefined,
      pageUrl: undefined
    }

    const { request, getPostedEvent } = createRequestMock()

    await send(request, baseSettings, [eventWithoutAppName])

    const result = getPostedEvent()
    if (!result) {
      throw new Error('No event was posted')
    }

    expect(result).toBeDefined()
    expect(result.appName).toBe('unnamed Segment app')
  })

  it('should use default appVersion when not provided', async () => {
    const eventWithoutAppVersion: Payload = {
      ...mockEvent,
      appVersion: undefined
    }

    const { request, getPostedEvent } = createRequestMock()

    await send(request, baseSettings, [eventWithoutAppVersion])

    const result = getPostedEvent()
    if (!result) {
      throw new Error('No event was posted')
    }

    expect(result).toBeDefined()
    expect(result.appVersion).toBe('unversioned')
  })

  it('should use appName from payload when provided', async () => {
    const eventWithAppName: Payload = {
      ...mockEvent,
      appName: 'My App'
    }

    const { request, getPostedEvent } = createRequestMock()

    await send(request, baseSettings, [eventWithAppName])

    const result = getPostedEvent()
    if (!result) {
      throw new Error('No event was posted')
    }

    expect(result).toBeDefined()
    expect(result.appName).toBe('My App')
  })

  it('should use appVersion from payload when provided', async () => {
    const eventWithAppVersion: Payload = {
      ...mockEvent,
      appVersion: '1.0.0'
    }

    const { request, getPostedEvent } = createRequestMock()

    await send(request, baseSettings, [eventWithAppVersion])

    const result = getPostedEvent()
    if (!result) {
      throw new Error('No event was posted')
    }

    expect(result).toBeDefined()
    expect(result.appVersion).toBe('1.0.0')
  })

  it('should extract event properties from payload', async () => {
    const { request, getPostedEvent } = createRequestMock()

    await send(request, baseSettings, [mockEvent])

    const result = getPostedEvent()
    if (!result) {
      throw new Error('No event was posted')
    }

    expect(result).toBeDefined()
    expect(result.eventProperties).toHaveLength(2)

    const userIdProp = result.eventProperties.find((p) => p.propertyName === 'userId')
    expect(userIdProp).toBeDefined()
    expect(userIdProp?.propertyType).toBe('string')

    const amountProp = result.eventProperties.find((p) => p.propertyName === 'amount')
    expect(amountProp).toBeDefined()
    expect(amountProp?.propertyType).toBe('int')
  })

  it('should validate regex constraints from object-map rx format', async () => {
    const eventWithRegexProperty: Payload = {
      ...mockEvent,
      properties: {
        'Shutterfly Id': 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
      }
    }

    const eventSpecResponseWithRegexObject: EventSpecResponseWire = {
      events: [
        {
          b: 'main',
          id: 'test-event-id',
          vids: [],
          p: {
            'Shutterfly Id': {
              t: 'string',
              r: true,
              rx: {
                '^(a+)+$': ['test-event-id']
              }
            }
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

    const { request, getPostedEvent } = createRequestMock(eventSpecResponseWithRegexObject)
    await send(request, { ...baseSettings, env: 'dev' }, [eventWithRegexProperty])

    const result = getPostedEvent()
    if (!result) {
      throw new Error('No event was posted')
    }

    const regexProp = result.eventProperties.find((p) => p.propertyName === 'Shutterfly Id')
    expect(regexProp).toBeDefined()
    expect(regexProp?.failedEventIds).toBeUndefined()
  })

  it('should validate regex constraints from legacy string rx format', async () => {
    const eventWithRegexProperty: Payload = {
      ...mockEvent,
      properties: {
        'Shutterfly Id': 'aaaa'
      }
    }

    const eventSpecResponseWithRegexString: EventSpecResponseWire = {
      events: [
        {
          b: 'main',
          id: 'test-event-id',
          vids: [],
          p: {
            'Shutterfly Id': {
              t: 'string',
              r: true,
              rx: '^a+$'
            }
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

    const { request, getPostedEvent } = createRequestMock(eventSpecResponseWithRegexString)
    await send(request, { ...baseSettings, env: 'dev' }, [eventWithRegexProperty])

    const result = getPostedEvent()
    if (!result) {
      throw new Error('No event was posted')
    }

    const regexProp = result.eventProperties.find((p) => p.propertyName === 'Shutterfly Id')
    expect(regexProp).toBeDefined()
    expect(regexProp?.failedEventIds).toBeUndefined()
  })
})
