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
  user_id: 'user123',
  anonymous_id: 'anon123',
  traits: {
    email: 'test@example.com',
    name: 'Test User',
    age: 25
  },
  timestamp: '2023-10-01T00:00:00Z'
} as Partial<SegmentEvent>

const mapping = {
  user_id: { '@path': '$.user_id' },
  anonymous_id: { '@path': '$.anonymous_id' },
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
      user_id: 'user123',
      anonymous_id: 'anon123',
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

  it('should work with only user_id (no anonymous_id)', async () => {
    const event = createTestEvent({
      ...payload,
      anonymous_id: undefined
    })

    const expectedJson = {
      user_id: 'user123',
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

  it('should work with only anonymous_id (no user_id)', async () => {
    const event = createTestEvent({
      ...payload,
      user_id: undefined
    })

    const expectedJson = {
      anonymous_id: 'anon123',
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

  it('should throw error when neither user_id nor anonymous_id provided', async () => {
    const event = createTestEvent({
      ...payload,
      user_id: undefined,
      anonymous_id: undefined
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
