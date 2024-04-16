import nock from 'nock'
import { createTestEvent, createTestIntegration, SegmentEvent } from '@segment/actions-core'
import Destination from '../../index'
import { MissingUserOrAnonymousIdThrowableError } from '../../errors'

const testDestination = createTestIntegration(Destination)

beforeEach(() => nock.cleanAll())

// Default Screen Mapping
const defaultScreenMapping = {
  user_id: {
    '@path': '$.userId'
  },
  anonymous_id: {
    '@path': '$.anonymousId'
  },
  properties: {
    '@path': '$.properties'
  }
}

describe('Segment.sendScreen', () => {
  test('Should throw an error if `userId or` `anonymousId` is not defined', async () => {
    const event = createTestEvent({
      name: 'Home',
      properties: {
        'Feed Type': 'private'
      }
    })

    await expect(
      testDestination.testAction('sendScreen', {
        event,
        mapping: {}
      })
    ).rejects.toThrowError(MissingUserOrAnonymousIdThrowableError)
  })

  test('Should return transformed event', async () => {
    const event = createTestEvent({
      name: 'Home',
      properties: {
        'Feed Type': 'private'
      },
      userId: 'test-user-ufi5bgkko5',
      anonymousId: 'arky4h2sh7k'
    })

    const responses = await testDestination.testAction('sendScreen', {
      event,
      mapping: defaultScreenMapping,
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
          properties: {
            ...event.properties
          },
          context: {}
        }
      ]
    })
  })

  it('should work with batch events', async () => {
    const events: SegmentEvent[] = [
      createTestEvent({
        name: 'Home',
        properties: {
          'Feed Type': 'private'
        },
        userId: 'test-user-ufi5bgkko5',
        anonymousId: 'arky4h2sh7k'
      }),
      createTestEvent({
        name: 'Home',
        properties: {
          'Feed Type': 'private'
        },
        userId: 'test-user-ufi5bgkko5',
        anonymousId: 'arky4h2sh7k'
      })
    ]

    const responses = await testDestination.testBatchAction('sendScreen', {
      events,
      mapping: defaultScreenMapping,
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
          properties: {
            ...events[0].properties
          },
          context: {}
        },
        {
          userId: events[1].userId,
          anonymousId: events[1].anonymousId,
          properties: {
            ...events[1].properties
          },
          context: {}
        }
      ]
    })
  })
})
