import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
const ROADWAY_API_KEY = 'test-api-key'
const timestamp = '2024-09-26T15:21:15.449Z'

describe('Roadwayai.groupUser', () => {
  it('should validate action fields', async () => {
    const event = createTestEvent({
      type: 'group',
      timestamp,
      userId: 'user123',
      groupId: 'group456',
      traits: {
        name: 'Engineering Team',
        industry: 'Technology'
      }
    })

    nock('https://app.roadwayai.com').post('/api/v1/segment/events/group').reply(200, {})

    const responses = await testDestination.testAction('groupUser', {
      event,
      useDefaultMappings: true,
      settings: {
        apiKey: ROADWAY_API_KEY
      }
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
    expect(responses[0].options.json).toMatchObject([
      expect.objectContaining({
        user_id: 'user123',
        group_id: 'group456',
        group_name: 'Engineering Team'
      })
    ])
  })

  it('should handle custom mapping', async () => {
    const event = createTestEvent({
      type: 'group',
      timestamp,
      userId: 'customuser',
      groupId: 'customgroup',
      traits: {
        name: 'Custom Group',
        custom_field: 'custom_value'
      }
    })

    nock('https://app.roadwayai.com').post('/api/v1/segment/events/group').reply(200, {})

    const responses = await testDestination.testAction('groupUser', {
      event,
      mapping: {
        user_id: {
          '@path': '$.userId'
        },
        group_id: {
          '@path': '$.groupId'
        },
        group_name: {
          '@path': '$.traits.name'
        },
        traits: {
          '@path': '$.traits'
        },
        timestamp: {
          '@path': '$.timestamp'
        }
      },
      settings: {
        apiKey: ROADWAY_API_KEY
      }
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject([
      expect.objectContaining({
        user_id: 'customuser',
        group_id: 'customgroup',
        group_name: 'Custom Group'
      })
    ])
  })

  it('should handle events with anonymous_id', async () => {
    const event = createTestEvent({
      type: 'group',
      timestamp,
      anonymousId: 'anon123',
      groupId: 'group456',
      traits: {
        name: 'Anonymous Group'
      }
    })

    nock('https://app.roadwayai.com').post('/api/v1/segment/events/group').reply(200, {})

    const responses = await testDestination.testAction('groupUser', {
      event,
      useDefaultMappings: true,
      settings: {
        apiKey: ROADWAY_API_KEY
      }
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject([
      expect.objectContaining({
        anonymous_id: 'anon123',
        group_id: 'group456',
        group_name: 'Anonymous Group'
      })
    ])
  })

  it('should handle events with context', async () => {
    const event = createTestEvent({
      type: 'group',
      timestamp,
      userId: 'user123',
      groupId: 'group456',
      traits: {
        name: 'Context Group'
      },
      context: {
        ip: '192.168.1.1',
        userAgent: 'test-agent'
      }
    })

    nock('https://app.roadwayai.com').post('/api/v1/segment/events/group').reply(200, {})

    const responses = await testDestination.testAction('groupUser', {
      event,
      useDefaultMappings: true,
      settings: {
        apiKey: ROADWAY_API_KEY
      }
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject([
      expect.objectContaining({
        user_id: 'user123',
        group_id: 'group456',
        context: expect.objectContaining({
          ip: '192.168.1.1'
        })
      })
    ])
  })

  it('should require timestamp field', async () => {
    const event = createTestEvent({
      type: 'group',
      userId: 'user123',
      groupId: 'group456',
      traits: {
        name: 'Test Group'
      }
    })
    event.timestamp = undefined

    nock('https://app.roadwayai.com').post('/api/v1/segment/events/group').reply(200, {})

    try {
      await testDestination.testAction('groupUser', {
        event,
        useDefaultMappings: true,
        settings: {
          apiKey: ROADWAY_API_KEY
        }
      })
    } catch (e) {
      expect(e.message).toBe("The root value is missing the required field 'timestamp'.")
    }
  })

  it('should invoke performBatch for batches', async () => {
    const events = [
      createTestEvent({
        type: 'group',
        timestamp,
        userId: 'user1',
        groupId: 'group1',
        traits: {
          name: 'Group One',
          industry: 'Finance'
        }
      }),
      createTestEvent({
        type: 'group',
        timestamp,
        userId: 'user2',
        groupId: 'group2',
        traits: {
          name: 'Group Two',
          industry: 'Healthcare'
        }
      })
    ]

    nock('https://app.roadwayai.com').post('/api/v1/segment/events/group').reply(200, {})

    const responses = await testDestination.testBatchAction('groupUser', {
      events,
      useDefaultMappings: true,
      settings: {
        apiKey: ROADWAY_API_KEY
      }
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
    expect(responses[0].options.json).toMatchObject([
      expect.objectContaining({
        user_id: 'user1',
        group_id: 'group1',
        group_name: 'Group One'
      }),
      expect.objectContaining({
        user_id: 'user2',
        group_id: 'group2',
        group_name: 'Group Two'
      })
    ])
  })
})
