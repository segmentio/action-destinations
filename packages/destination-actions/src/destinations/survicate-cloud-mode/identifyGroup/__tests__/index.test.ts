import nock from 'nock'
import { createTestEvent, createTestIntegration, SegmentEvent } from '@segment/actions-core'
import Definition from '../../index'
import { Settings } from '../../generated-types'

let testDestination = createTestIntegration(Definition)
const settings: Settings = {
  apiKey: 'test_api_key'
}

const payload = {
  type: 'group',
  groupId: 'group123',
  traits: {
    name: 'Test Group',
    industry: 'Technology',
    size: 100
  },
  timestamp: '2023-10-01T00:00:00Z'
} as Partial<SegmentEvent>

const mapping = {
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

  it('should handle empty traits object', async () => {
    const event = createTestEvent({
      ...payload,
      traits: {}
    })

    const expectedJson = {
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
