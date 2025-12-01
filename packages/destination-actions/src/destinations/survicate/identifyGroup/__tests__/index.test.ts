import nock from 'nock'
import { createTestEvent, createTestIntegration, SegmentEvent } from '@segment/actions-core'
import Definition from '../../index'
import { Settings } from '../../generated-types'

let testDestination = createTestIntegration(Definition)
const settings: Settings = {
  apiKey: 'test_api_key'
}

const payload = {
  type: 'group' as const,
  user_id: 'user123',
  anonymous_id: 'anon123',
  group_id: 'group123',
  traits: {
    name: 'Test Group',
    industry: 'Technology',
    size: 100
  },
  timestamp: '2023-10-01T00:00:00Z'
} as Partial<SegmentEvent>

const mapping = {
  user_id: { '@path': '$.user_id' },
  anonymous_id: { '@path': '$.anonymous_id' },
  group_id: { '@path': '$.group_id' },
  traits: { '@path': '$.traits' },
  timestamp: { '@path': '$.timestamp' }
}

beforeEach(() => {
  testDestination = createTestIntegration(Definition)
  nock.cleanAll()
})

describe('Survicate Cloud Mode - identifyGroup', () => {
  it('should send identify group payload to Survicate', async () => {
    const event = createTestEvent(payload)

    const expectedJson = {
      user_id: 'user123',
      anonymous_id: 'anon123',
      group_id: 'group123',
      traits: {
        group_name: 'Test Group',
        group_industry: 'Technology',
        group_size: 100
      },
      timestamp: '2023-10-01T00:00:00Z'
    }

    nock('https://integrations.survicate.com').post('/endpoint/segment/group', expectedJson).reply(200, {})

    const response = await testDestination.testAction('identifyGroup', {
      event,
      settings,
      useDefaultMappings: true,
      mapping
    })

    expect(response.length).toBe(1)
  })

  it('should throw error when user_id is not provided', async () => {
    const event = createTestEvent({
      ...payload,
      user_id: undefined
    })

    await expect(
      testDestination.testAction('identifyGroup', {
        event,
        settings,
        useDefaultMappings: true,
        mapping
      })
    ).rejects.toThrowError()
  })

  it('should throw error when group_id is missing', async () => {
    const event = createTestEvent({
      ...payload,
      group_id: undefined
    })

    await expect(
      testDestination.testAction('identifyGroup', {
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
      testDestination.testAction('identifyGroup', {
        event,
        settings,
        useDefaultMappings: true,
        mapping
      })
    ).rejects.toThrowError()
  })
})
