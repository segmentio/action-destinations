import nock from 'nock'
import { createTestEvent, createTestIntegration, SegmentEvent } from '@segment/actions-core'
import Destination from '../../index'
import { MissingUserOrAnonymousIdThrowableError } from '../../errors'

const testDestination = createTestIntegration(Destination)

beforeEach(() => nock.cleanAll())

// Default Identify Mapping
const defaultIdentifyMapping = {
  user_id: {
    '@path': '$.userId'
  },
  anonymous_id: {
    '@path': '$.anonymousId'
  },
  traits: {
    '@path': '$.traits'
  }
}

describe('Segment.sendIdentify', () => {
  test('Should throw an error if `userId or` `anonymousId` is not defined', async () => {
    const event = createTestEvent({
      type: 'identify',
      traits: {
        name: 'Test User',
        email: 'test-user@test-company.com'
      }
    })

    await expect(
      testDestination.testAction('sendIdentify', {
        event,
        mapping: {}
      })
    ).rejects.toThrowError(MissingUserOrAnonymousIdThrowableError)
  })

  test('Should return transformed event', async () => {
    const event = createTestEvent({
      type: 'identify',
      traits: {
        name: 'Test User',
        email: 'test-user@test-company.com'
      },
      userId: 'test-user-ufi5bgkko5',
      anonymousId: 'arky4h2sh7k'
    })

    const responses = await testDestination.testAction('sendIdentify', {
      event,
      mapping: defaultIdentifyMapping,
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
        type: 'identify',
        traits: {
          name: 'Test User',
          email: 'test-user@test-company.com'
        },
        userId: 'test-user-ufi5bgkko5',
        anonymousId: 'arky4h2sh7k'
      }),
      createTestEvent({
        type: 'identify',
        traits: {
          name: 'Test User',
          email: 'test-user@test-company.com'
        },
        userId: 'test-user-ufi5bgkko5'
      })
    ]

    const responses = await testDestination.testBatchAction('sendIdentify', {
      events,
      mapping: defaultIdentifyMapping,
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
          traits: {
            ...events[0].traits
          },
          context: {}
        },
        {
          userId: events[1].userId,
          traits: {
            ...events[1].traits
          },
          context: {}
        }
      ]
    })
  })
})
