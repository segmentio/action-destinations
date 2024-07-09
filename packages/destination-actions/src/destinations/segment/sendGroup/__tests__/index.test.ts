import nock from 'nock'
import { createTestEvent, createTestIntegration, SegmentEvent } from '@segment/actions-core'
import Destination from '../../index'
import { MissingUserOrAnonymousIdThrowableError } from '../../errors'

const testDestination = createTestIntegration(Destination)

beforeEach(() => nock.cleanAll())

// Default Group Mapping
const defaultGroupMapping = {
  user_id: {
    '@path': '$.userId'
  },
  anonymous_id: {
    '@path': '$.anonymousId'
  },
  group_id: {
    '@path': '$.groupId'
  },
  traits: {
    '@path': '$.traits'
  }
}

describe('Segment.sendGroup', () => {
  test('Should throw an error if `userId or` `anonymousId` is not defined', async () => {
    const event = createTestEvent({
      traits: {
        name: 'Example Corp',
        industry: 'Technology'
      },
      groupId: 'test-group-ks2i7e'
    })

    await expect(
      testDestination.testAction('sendGroup', {
        event,
        mapping: {
          group_id: {
            '@path': '$.groupId'
          }
        }
      })
    ).rejects.toThrowError(MissingUserOrAnonymousIdThrowableError)
  })

  test('Should return transformed event', async () => {
    const event = createTestEvent({
      traits: {
        name: 'Example Corp',
        industry: 'Technology'
      },
      userId: 'test-user-ufi5bgkko5',
      anonymousId: 'arky4h2sh7k',
      groupId: 'test-group-ks2i7e'
    })

    const responses = await testDestination.testAction('sendGroup', {
      event,
      mapping: defaultGroupMapping,
      settings: {
        source_write_key: 'test-source-write-key'
      }
    })

    const results = testDestination.results
    expect(responses.length).toBe(0)
    expect(results.length).toBe(3)
    expect(results[2].data).toMatchObject({
      batch: [
        {
          userId: event.userId,
          anonymousId: event.anonymousId,
          groupId: event.groupId,
          traits: {
            ...event.traits
          },
          context: {}
        }
      ]
    })
  })

  it('should work with batch events', async () => {
    const events: SegmentEvent[] = [
      createTestEvent({
        traits: {
          name: 'Example Corp',
          industry: 'Technology'
        },
        userId: 'test-user-ufi5bgkko5',
        anonymousId: 'arky4h2sh7k',
        groupId: 'test-group-ks2i7e'
      }),
      createTestEvent({
        traits: {
          name: 'Example Corp',
          industry: 'Technology'
        },
        userId: 'test-user-ufi5bgkko5',
        groupId: 'test-group-ks2i7e'
      })
    ]

    const responses = await testDestination.testBatchAction('sendGroup', {
      events,
      mapping: defaultGroupMapping,
      settings: {
        source_write_key: 'test-source-write-key'
      }
    })

    const results = testDestination.results
    expect(responses.length).toBe(0)
    expect(results.length).toBe(1)
    expect(results[0].data).toMatchObject({
      batch: [
        {
          userId: events[0].userId,
          anonymousId: events[0].anonymousId,
          groupId: events[0].groupId,
          traits: {
            ...events[0].traits
          },
          context: {}
        },
        {
          userId: events[1].userId,
          groupId: events[0].groupId,
          traits: {
            ...events[0].traits
          },
          context: {}
        }
      ]
    })
  })
})
