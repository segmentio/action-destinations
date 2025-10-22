import nock from 'nock'
import { createTestEvent, createTestIntegration, SegmentEvent } from '@segment/actions-core'
import Definition from '../../index'
import { Settings } from '../../generated-types'

let testDestination = createTestIntegration(Definition)
const settings: Settings = {
  apiKey: 'test_api_key'
}

const payload = {
  type: 'identify' as const,
  userId: 'user123',
  anonymousId: 'anon123',
  traits: {
    email: 'test@example.com',
    name: 'Test User',
    age: 25
  },
  timestamp: '2023-10-01T00:00:00Z'
} as Partial<SegmentEvent>

const mapping = {
  userId: { '@path': '$.userId' },
  anonymousId: { '@path': '$.anonymousId' },
  traits: { '@path': '$.traits' },
  timestamp: { '@path': '$.timestamp' }
}

beforeEach(() => {
  testDestination = createTestIntegration(Definition)
  nock.cleanAll()
})

describe('Survicate Cloud Mode - identifyUser', () => {
  it('should send identify user payload to Survicate', async () => {
    const event = createTestEvent(payload)

    const expectedJson = {
      userId: 'user123',
      anonymousId: 'anon123',
      timestamp: '2023-10-01T00:00:00Z',
      traits: {
        email: 'test@example.com',
        name: 'Test User',
        age: 25
      }
    }

    nock('https://integrations.survicate.com').post('/endpoint/segment/identify', expectedJson).reply(200, {})

    const response = await testDestination.testAction('identifyUser', {
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
      userId: 'user123',
      timestamp: '2023-10-01T00:00:00Z',
      traits: {
        email: 'test@example.com',
        name: 'Test User',
        age: 25
      }
    }

    nock('https://integrations.survicate.com').post('/endpoint/segment/identify', expectedJson).reply(200, {})

    const response = await testDestination.testAction('identifyUser', {
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
      anonymousId: 'anon123',
      timestamp: '2023-10-01T00:00:00Z',
      traits: {
        email: 'test@example.com',
        name: 'Test User',
        age: 25
      }
    }

    nock('https://integrations.survicate.com').post('/endpoint/segment/identify', expectedJson).reply(200, {})

    const response = await testDestination.testAction('identifyUser', {
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
      testDestination.testAction('identifyUser', {
        event,
        settings,
        useDefaultMappings: true,
        mapping
      })
    ).rejects.toThrow('User ID or Anonymous ID is required')
  })

  it('should throw error when traits are missing', async () => {
    const event = createTestEvent({
      ...payload,
      traits: undefined
    })

    await expect(
      testDestination.testAction('identifyUser', {
        event,
        settings,
        useDefaultMappings: true,
        mapping
      })
    ).rejects.toThrowError()
  })
})
