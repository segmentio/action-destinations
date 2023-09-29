import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { MissingUserOrAnonymousIdThrowableError } from '../../errors'

const testDestination = createTestIntegration(Destination)

beforeEach(() => nock.cleanAll())

// Default Page Mapping
const defaultTrackMapping = {
  event_name: {
    '@path': '$.event'
  },
  user_id: {
    '@path': '$.userId'
  },
  anonymous_id: {
    '@path': '$.anonymousId'
  },
  properties: {
    '@path': '$.properties'
  },
  traits: {
    '@path': '$.traits'
  }
}

describe('Segment.sendTrack', () => {
  test('Should throw an error if `userId or` `anonymousId` is not defined', async () => {
    const event = createTestEvent({
      properties: {
        plan: 'Business'
      },
      event: 'Test Event'
    })

    await expect(
      testDestination.testAction('sendTrack', {
        event,
        mapping: {
          event_name: {
            '@path': '$.event'
          }
        }
      })
    ).rejects.toThrowError(MissingUserOrAnonymousIdThrowableError)
  })

  test('Should not send event and return transformed payload', async () => {
    const event = createTestEvent({
      properties: {
        plan: 'Business'
      },
      userId: 'test-user-ufi5bgkko5',
      anonymousId: 'arky4h2sh7k',
      event: 'Test Event'
    })

    const responses = await testDestination.testAction('sendTrack', {
      event,
      mapping: defaultTrackMapping,
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
})
