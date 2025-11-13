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
  user_id: 'user123',
  anonymous_id: 'anon123',
  properties: {
    category: 'test',
    value: 100,
    custom_prop: 'custom_value'
  },
  timestamp: '2023-10-01T00:00:00Z'
} as Partial<SegmentEvent>

const mapping = {
  user_id: { '@path': '$.user_id' },
  anonymous_id: { '@path': '$.anonymous_id' },
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
      user_id: 'user123',
      anonymous_id: 'anon123',
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

  it('should work with only user_id (no anonymous_id)', async () => {
    const event = createTestEvent({
      ...payload,
      anonymous_id: undefined
    })

    const expectedJson = {
      name: 'Test Event',
      user_id: 'user123',
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

  it('should work with only anonymous_id (no user_id)', async () => {
    const event = createTestEvent({
      ...payload,
      user_id: undefined
    })

    const expectedJson = {
      name: 'Test Event',
      anonymous_id: 'anon123',
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
      timestamp: '2023-10-01T00:00:00Z',
      user_id: 'user123',
      anonymous_id: 'anon123'
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

  it('should throw error when neither user_id nor anonymous_id provided', async () => {
    const event = createTestEvent({
      ...payload,
      user_id: undefined,
      anonymous_id: undefined
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
