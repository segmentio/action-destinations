import { extractSchemaFromEvent } from '../avo'
import type { Payload } from '../generated-types'
import type { EventSpecResponse } from '../eventSpec/EventFetcherTypes'

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

  const validEventSpec: EventSpecResponse = {
    events: [
      {
        branchId: 'main',
        baseEventId: 'test-event-id',
        variantIds: [],
        props: {
          userId: { type: 'string', required: true, isList: false },
          amount: { type: 'number', required: false, isList: false }
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

  it('should return event body with validation when eventSpec is provided', () => {
    const result = extractSchemaFromEvent(mockEvent, undefined, undefined, 'dev', validEventSpec)

    expect(result).toBeDefined()
    expect(result.eventName).toBe('TestEvent')
    expect(result.type).toBe('event')
    expect(result.messageId).toBe('test-message-id')
    // Should include validation metadata when spec is provided
    expect(result.metadata).toBeDefined()
  })

  it('should return event body without validation when eventSpec is null', () => {
    const result = extractSchemaFromEvent(mockEvent, undefined, undefined, 'dev', null)

    expect(result).toBeDefined()
    expect(result.eventName).toBe('TestEvent')
    expect(result.type).toBe('event')
    expect(result.messageId).toBe('test-message-id')
    // Should not include validation metadata when spec is null
    expect(result.metadata).toBeUndefined()
  })

  it('should work with appVersionPropertyName', () => {
    const eventWithAppVersion: Payload = {
      ...mockEvent,
      properties: {
        ...mockEvent.properties,
        customAppVersion: '2.0.0'
      }
    }

    const result = extractSchemaFromEvent(eventWithAppVersion, 'customAppVersion', undefined, 'dev', null)

    expect(result).toBeDefined()
    expect(result.appVersion).toBe('2.0.0')
  })

  it('should handle events without properties', () => {
    const eventWithoutProperties: Payload = {
      ...mockEvent,
      properties: {}
    }

    const result = extractSchemaFromEvent(eventWithoutProperties, undefined, undefined, 'dev', null)

    expect(result).toBeDefined()
    expect(result.eventName).toBe('TestEvent')
    expect(result.eventProperties).toEqual([])
  })

  it('should handle events with pageUrl for appName extraction', () => {
    const eventWithPageUrl: Payload = {
      ...mockEvent,
      pageUrl: 'https://example.com/page'
    }

    const result = extractSchemaFromEvent(eventWithPageUrl, undefined, undefined, 'dev', null)

    expect(result).toBeDefined()
    expect(result.appName).toBe('example.com')
  })

  it('should use default appName when not provided', () => {
    const eventWithoutAppName: Payload = {
      ...mockEvent,
      appName: undefined,
      pageUrl: undefined
    }

    const result = extractSchemaFromEvent(eventWithoutAppName, undefined, undefined, 'dev', null)

    expect(result).toBeDefined()
    expect(result.appName).toBe('unnamed Segment app')
  })

  it('should use default appVersion when not provided', () => {
    const eventWithoutAppVersion: Payload = {
      ...mockEvent,
      appVersion: undefined
    }

    const result = extractSchemaFromEvent(eventWithoutAppVersion, undefined, undefined, 'dev', null)

    expect(result).toBeDefined()
    expect(result.appVersion).toBe('unversioned')
  })

  it('should use appName from payload when provided', () => {
    const eventWithAppName: Payload = {
      ...mockEvent,
      appName: 'My App'
    }

    const result = extractSchemaFromEvent(eventWithAppName, undefined, undefined, 'dev', null)

    expect(result).toBeDefined()
    expect(result.appName).toBe('My App')
  })

  it('should use appVersion from payload when provided', () => {
    const eventWithAppVersion: Payload = {
      ...mockEvent,
      appVersion: '1.0.0'
    }

    const result = extractSchemaFromEvent(eventWithAppVersion, undefined, undefined, 'dev', null)

    expect(result).toBeDefined()
    expect(result.appVersion).toBe('1.0.0')
  })

  it('should extract event properties from payload', () => {
    const result = extractSchemaFromEvent(mockEvent, undefined, undefined, 'dev', null)

    expect(result).toBeDefined()
    expect(result.eventProperties).toHaveLength(2)

    const userIdProp = result.eventProperties.find((p) => p.propertyName === 'userId')
    expect(userIdProp).toBeDefined()
    expect(userIdProp?.propertyType).toBe('string')

    const amountProp = result.eventProperties.find((p) => p.propertyName === 'amount')
    expect(amountProp).toBeDefined()
    expect(amountProp?.propertyType).toBe('int')
  })

  it('should continue without validation if validation throws', () => {
    // Create an event spec that might cause validation issues
    const problematicEventSpec: EventSpecResponse = {
      events: [],
      metadata: {
        schemaId: 'test-schema-id',
        branchId: 'main',
        latestActionId: 'test-action-id',
        sourceId: 'test-source-id'
      }
    }

    const result = extractSchemaFromEvent(mockEvent, undefined, undefined, 'dev', problematicEventSpec)

    expect(result).toBeDefined()
    expect(result.eventName).toBe('TestEvent')
    expect(result.type).toBe('event')
  })
})
