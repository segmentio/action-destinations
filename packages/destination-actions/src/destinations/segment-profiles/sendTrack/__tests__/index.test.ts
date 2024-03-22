import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { DEFAULT_SEGMENT_ENDPOINT } from '../../properties'
import { MissingUserOrAnonymousIdThrowableError } from '../../errors'

const testDestination = createTestIntegration(Destination)

beforeEach(() => nock.cleanAll())

// Default Track Mapping
const defaultTrackMapping = {
  engage_space: 'space-write-key',
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
  timstamp: {
    '@path': '$.timestamp'
  }
}

describe('SegmentProfiles.sendTrack', () => {
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
          },
          engage_space: 'space-write-key'
        }
      })
    ).rejects.toThrowError(MissingUserOrAnonymousIdThrowableError)
  })

  test('Should return transformed segment track event', async () => {
    const event = createTestEvent({
      properties: {
        plan: 'Business'
      },
      userId: 'test-user-ufi5bgkko5',
      anonymousId: 'arky4h2sh7k',
      timestamp: '2023-09-26T09:46:28.290Z',
      event: 'Test Event'
    })

    const responses = await testDestination.testAction('sendTrack', {
      event,
      mapping: defaultTrackMapping,
      settings: {
        endpoint: DEFAULT_SEGMENT_ENDPOINT
      }
    })

    const results = testDestination.results
    expect(responses.length).toBe(0)
    expect(results.length).toBe(3)
    expect(results[2].data).toMatchSnapshot()
  })
})
