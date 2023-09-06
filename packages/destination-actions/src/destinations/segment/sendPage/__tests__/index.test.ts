import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { SEGMENT_ENDPOINTS, DEFAULT_SEGMENT_ENDPOINT } from '../../properties'
import { MissingUserOrAnonymousIdThrowableError, InvalidEndpointSelectedThrowableError } from '../../errors'
const testDestination = createTestIntegration(Destination)

beforeEach(() => nock.cleanAll())

// Default Page Mapping
const defaultPageMapping = {
  user_id: {
    '@path': '$.userId'
  },
  anonymous_id: {
    '@path': '$.anonymousId'
  },
  page_name: {
    '@path': '$.name'
  },
  properties: {
    '@path': '$.properties'
  }
}

describe('Segment.sendPage', () => {
  test('Should throw an error if `userId or` `anonymousId` is not defined', async () => {
    const event = createTestEvent({
      name: 'Home',
      properties: {
        title: 'Home | Example Company',
        url: 'http://www.example.com'
      }
    })

    await expect(
      testDestination.testAction('sendPage', {
        event,
        mapping: {}
      })
    ).rejects.toThrowError(MissingUserOrAnonymousIdThrowableError)
  })

  test('Should throw an error if Segment Endpoint is incorrectly defined', async () => {
    const event = createTestEvent({
      name: 'Home',
      properties: {
        title: 'Home | Example Company',
        url: 'http://www.example.com'
      },
      userId: 'test-user-ufi5bgkko5',
      anonymousId: 'arky4h2sh7k'
    })

    await expect(
      testDestination.testAction('sendPage', {
        event,
        mapping: defaultPageMapping,
        settings: {
          source_write_key: 'test-source-write-key',
          endpoint: 'incorrect-endpoint'
        }
      })
    ).rejects.toThrowError(InvalidEndpointSelectedThrowableError)
  })

  test('Should send an page event to Segment', async () => {
    // Mock: Segment Page Call
    const segmentEndpoint = SEGMENT_ENDPOINTS[DEFAULT_SEGMENT_ENDPOINT].url
    nock(segmentEndpoint).post('/page').reply(200, { success: true })

    const event = createTestEvent({
      name: 'Home',
      properties: {
        title: 'Home | Example Company',
        url: 'http://www.example.com'
      },
      userId: 'test-user-ufi5bgkko5',
      anonymousId: 'arky4h2sh7k'
    })

    const responses = await testDestination.testAction('sendPage', {
      event,
      mapping: defaultPageMapping,
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
        name: event.name,
        ...event.properties
      },
      context: {}
    })
  })

  test('Should not send event if actions-segment-tapi-internal-enabled flag is enabled', async () => {
    const event = createTestEvent({
      name: 'Home',
      properties: {
        title: 'Home | Example Company',
        url: 'http://www.example.com'
      },
      userId: 'test-user-ufi5bgkko5',
      anonymousId: 'arky4h2sh7k'
    })

    const responses = await testDestination.testAction('sendPage', {
      event,
      mapping: defaultPageMapping,
      settings: {
        source_write_key: 'test-source-write-key',
        endpoint: DEFAULT_SEGMENT_ENDPOINT
      },
      features: {
        'actions-segment-tapi-internal-enabled': true
      }
    })

    const results = testDestination.results
    expect(responses.length).toBe(0)
    expect(results.length).toBe(3)
    expect(results[2].data).toMatchObject({
      userId: event.userId,
      anonymousId: event.anonymousId,
      properties: {
        name: event.name,
        ...event.properties
      },
      context: {}
    })
  })
})
