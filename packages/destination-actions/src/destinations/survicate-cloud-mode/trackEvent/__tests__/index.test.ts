import nock from 'nock'
import { createTestEvent, createTestIntegration, SegmentEvent } from '@segment/actions-core'
import Definition from '../../index'
import { Settings } from '../../generated-types'

let testDestination = createTestIntegration(Definition)
const settings: Settings = {
  apiKey: 'test_api_key'
}

const payload = {
  type: 'track' as const,
  event: 'Test Event',
  userId: 'user123',
  anonymousId: 'anon123',
  properties: {
    category: 'test',
    value: 100,
    custom_prop: 'custom_value'
  },
  timestamp: '2023-10-01T00:00:00Z'
} as Partial<SegmentEvent>

const mapping = {
  userId: { '@path': '$.userId' },
  anonymousId: { '@path': '$.anonymousId' },
  name: { '@path': '$.event' },
  properties: { '@path': '$.properties' },
  timestamp: { '@path': '$.timestamp' }
}

beforeEach(() => {
  testDestination = createTestIntegration(Definition)
  nock.cleanAll()
})

describe('Survicate Cloud Mode - trackEvent', () => {
  it('should send track event payload to Survicate', async () => {
    const event = createTestEvent(payload)

    const expectedJson = {
      name: 'Test Event',
      properties: {
        category: 'test',
        value: 100,
        custom_prop: 'custom_value'
      },
      timestamp: '2023-10-01T00:00:00Z'
    }

    nock('https://integrations.survicate.com').post('/endpoint/segment/track', expectedJson).reply(200, {})

    const response = await testDestination.testAction('trackEvent', {
      event,
      settings,
      useDefaultMappings: true,
      mapping
    })

    expect(response.length).toBe(1)
  })

  it('should work with only userId (no anonymousId)', async () => {
    const event = createTestEvent({
      ...payload,
      anonymousId: undefined
    })

    const expectedJson = {
      name: 'Test Event',
      properties: {
        category: 'test',
        value: 100,
        custom_prop: 'custom_value'
      },
      timestamp: '2023-10-01T00:00:00Z'
    }

    nock('https://integrations.survicate.com').post('/endpoint/segment/track', expectedJson).reply(200, {})

    const response = await testDestination.testAction('trackEvent', {
      event,
      settings,
      useDefaultMappings: true,
      mapping
    })

    expect(response.length).toBe(1)
  })

  it('should work with only anonymousId (no userId)', async () => {
    const event = createTestEvent({
      ...payload,
      userId: undefined
    })

    const expectedJson = {
      name: 'Test Event',
      properties: {
        category: 'test',
        value: 100,
        custom_prop: 'custom_value'
      },
      timestamp: '2023-10-01T00:00:00Z'
    }

    nock('https://integrations.survicate.com').post('/endpoint/segment/track', expectedJson).reply(200, {})

    const response = await testDestination.testAction('trackEvent', {
      event,
      settings,
      useDefaultMappings: true,
      mapping
    })

    expect(response.length).toBe(1)
  })

  it('should work without properties', async () => {
    const event = createTestEvent({
      ...payload,
      properties: undefined
    })

    const expectedJson = {
      name: 'Test Event',
      timestamp: '2023-10-01T00:00:00Z'
    }

    nock('https://integrations.survicate.com').post('/endpoint/segment/track', expectedJson).reply(200, {})

    const response = await testDestination.testAction('trackEvent', {
      event,
      settings,
      useDefaultMappings: true,
      mapping
    })

    expect(response.length).toBe(1)
  })

  it('should throw error when neither userId nor anonymousId provided', async () => {
    const event = createTestEvent({
      ...payload,
      userId: undefined,
      anonymousId: undefined
    })

    await expect(
      testDestination.testAction('trackEvent', {
        event,
        settings,
        useDefaultMappings: true,
        mapping
      })
    ).rejects.toThrowError()
  })

  it('should throw error when event name is missing', async () => {
    const event = createTestEvent({
      ...payload,
      event: undefined
    })

    await expect(
      testDestination.testAction('trackEvent', {
        event,
        settings,
        useDefaultMappings: true,
        mapping
      })
    ).rejects.toThrowError()
  })
})
