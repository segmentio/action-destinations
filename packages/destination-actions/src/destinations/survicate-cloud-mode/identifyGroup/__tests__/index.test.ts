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
  userId: 'user123',
  anonymousId: 'anon123',
  groupId: 'group123',
  traits: {
    name: 'Test Group',
    industry: 'Technology',
    size: 100
  },
  timestamp: '2023-10-01T00:00:00Z'
} as Partial<SegmentEvent>

const mapping = {
  userId: { '@path': '$.userId' },
  anonymousId: { '@path': '$.anonymousId' },
  groupId: { '@path': '$.groupId' },
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
      userId: 'user123',
      anonymousId: 'anon123',
      groupId: 'group123',
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

  it('should work with only userId (no anonymousId)', async () => {
    const event = createTestEvent({
      ...payload,
      anonymousId: undefined
    })

    const expectedJson = {
      userId: 'user123',
      groupId: 'group123',
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

  it('should work with only anonymousId (no userId)', async () => {
    const event = createTestEvent({
      ...payload,
      userId: undefined
    })

    const expectedJson = {
      anonymousId: 'anon123',
      groupId: 'group123',
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

  it('should throw error when neither userId nor anonymousId provided', async () => {
    const event = createTestEvent({
      ...payload,
      userId: undefined,
      anonymousId: undefined
    })

    await expect(
      testDestination.testAction('identifyGroup', {
        event,
        settings,
        useDefaultMappings: true,
        mapping
      })
    ).rejects.toThrow('User ID or Anonymous ID is required')
  })

  it('should throw error when groupId is missing', async () => {
    const event = createTestEvent({
      ...payload,
      groupId: undefined
    })

    await expect(
      testDestination.testAction('identifyGroup', {
        event,
        settings,
        useDefaultMappings: true,
        mapping
      })
    ).rejects.toThrow('Group ID is required')
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

  it('should handle empty traits object', async () => {
    const event = createTestEvent({
      ...payload,
      traits: {}
    })

    const expectedJson = {
      userId: 'user123',
      anonymousId: 'anon123',
      groupId: 'group123',
      traits: {},
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
})
