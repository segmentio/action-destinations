import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('Roadwayai.groupUser', () => {
  it('should send group user event to RoadwayAI API', async () => {
    nock('https://app.roadwayai.com').post('/api/v1/segment/events/group').reply(200, { success: true })

    const event = createTestEvent({
      type: 'group',
      userId: 'user-123',
      anonymousId: 'anon-456',
      groupId: 'group-789',
      traits: {
        name: 'Engineering Team',
        industry: 'Technology',
        employees: 50,
        plan: 'enterprise'
      },
      context: {
        ip: '127.0.0.1'
      }
    })

    const mapping = {
      user_id: {
        '@path': '$.userId'
      },
      anonymous_id: {
        '@path': '$.anonymousId'
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
      },
      context: {
        '@path': '$.context'
      }
    }

    const settings = {
      apiKey: 'test-api-key'
    }

    const responses = await testDestination.testAction('groupUser', {
      event,
      mapping,
      settings
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toEqual([
      {
        user_id: 'user-123',
        anonymous_id: 'anon-456',
        group_id: 'group-789',
        group_name: 'Engineering Team',
        traits: {
          name: 'Engineering Team',
          industry: 'Technology',
          employees: 50,
          plan: 'enterprise'
        },
        context: {
          ip: '127.0.0.1'
        }
      }
    ])
    expect(responses[0].options.headers).toEqual({
      'x-api-key': 'test-api-key'
    })
  })

  it('should handle batch group user events', async () => {
    nock('https://app.roadwayai.com').post('/api/v1/segment/events/group').reply(200, { success: true })

    const events = [
      createTestEvent({
        type: 'group',
        userId: 'user-1',
        groupId: 'group-1',
        traits: {
          name: 'Group One',
          industry: 'Finance'
        }
      }),
      createTestEvent({
        type: 'group',
        userId: 'user-2',
        groupId: 'group-2',
        traits: {
          name: 'Group Two',
          industry: 'Healthcare'
        }
      })
    ]

    const settings = {
      apiKey: 'test-api-key'
    }

    const mapping = {
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
      }
    }

    const responses = await testDestination.testBatchAction('groupUser', {
      events,
      mapping,
      settings
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toContainEqual(
      expect.objectContaining({
        user_id: 'user-1',
        group_id: 'group-1',
        group_name: 'Group One',
        traits: {
          name: 'Group One',
          industry: 'Finance'
        }
      })
    )
    expect(responses[0].options.json).toContainEqual(
      expect.objectContaining({
        user_id: 'user-2',
        group_id: 'group-2',
        group_name: 'Group Two',
        traits: {
          name: 'Group Two',
          industry: 'Healthcare'
        }
      })
    )
  })
})
