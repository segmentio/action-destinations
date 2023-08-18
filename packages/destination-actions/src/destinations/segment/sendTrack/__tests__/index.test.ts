import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { SEGMENT_ENDPOINTS, DEFAULT_SEGMENT_ENDPOINT } from '../../properties'
import { MissingUserOrAnonymousIdThrowableError, InvalidEndpointSelectedThrowableError } from '../../errors'

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

  test('Should throw an error if Segment Endpoint is incorrectly defined', async () => {
    const event = createTestEvent({
      properties: {
        plan: 'Business'
      },
      userId: 'test-user-ufi5bgkko5',
      anonymousId: 'arky4h2sh7k',
      event: 'Test Event'
    })

    await expect(
      testDestination.testAction('sendTrack', {
        event,
        mapping: defaultTrackMapping,
        settings: {
          source_write_key: 'test-source-write-key',
          endpoint: 'incorrect-endpoint'
        }
      })
    ).rejects.toThrowError(InvalidEndpointSelectedThrowableError)
  })

  test('Should send an track event to Segment', async () => {
    // Mock: Segment Track Call
    const segmentEndpoint = SEGMENT_ENDPOINTS[DEFAULT_SEGMENT_ENDPOINT].url
    nock(segmentEndpoint).post('/track').reply(200, { success: true })

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
        source_write_key: 'test-source-write-key',
        endpoint: DEFAULT_SEGMENT_ENDPOINT
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toEqual(200)
    expect(responses[0].options.json).toMatchObject({
      userId: event.userId,
      anonymousId: event.anonymousId,
      properties: {
        ...event.properties
      },
      context: {}
    })
  })

  test('Should not send event if actions-segment-tapi-internal flag is enabled', async () => {
    const event = createTestEvent({
      properties: {
        plan: 'Business'
      },
      userId: 'test-user-ufi5bgkko5',
      anonymousId: 'arky4h2sh7k',
      event: 'Test Event'
    })

    const { results, responses } = await testDestination.testAction2('sendTrack', {
      event,
      mapping: defaultTrackMapping,
      settings: {
        source_write_key: 'test-source-write-key',
        endpoint: DEFAULT_SEGMENT_ENDPOINT
      },
      features: {
        'actions-segment-tapi-internal': true
      }
    })

    expect(responses.length).toBe(0)
    expect(results.length).toBe(1)
    expect(results[0].output).toMatchObject({
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
