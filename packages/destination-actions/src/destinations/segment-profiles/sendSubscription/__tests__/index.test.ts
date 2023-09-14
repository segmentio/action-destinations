import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { InvalidEndpointSelectedThrowableError, MissingUserOrAnonymousIdThrowableError } from '../../errors'
import { DEFAULT_SEGMENT_ENDPOINT, SEGMENT_ENDPOINTS } from '../../properties'

const testDestination = createTestIntegration(Destination)

beforeEach(() => nock.cleanAll())

// Default Identify Mapping
const defaultSubscriptionMapping = {
  user_id: {
    '@path': '$.userId'
  },
  anonymous_id: {
    '@path': '$.anonymousId'
  },
  traits: {
    '@path': '$.traits'
  },
  subscriptions: {
    '@path': '$.subscriptions'
  },
  engage_space: 'engage-space-writekey'
}
describe('SegmentProfiles.sendSubscription', () => {
  test('Should throw an error if `userId or` `anonymousId` is not defined', async () => {
    const event = createTestEvent({
      type: 'identify',
      traits: {
        name: 'Test User',
        email: 'test-user@test-company.com'
      },
      subscriptions: {
        key: 'tester11@seg.com',
        type: 'EMAIL',
        status: 'SUBSCRIBED',
        groups: {
          name: 'Newsletter',
          status: 'SUBSCRIBED'
        }
      }
    })

    await expect(
      testDestination.testAction('sendIdentify', {
        event,
        mapping: {
          engage_space: 'engage-space-writekey'
        }
      })
    ).rejects.toThrowError(MissingUserOrAnonymousIdThrowableError)
  })

  test('Should throw an error if Segment Endpoint is incorrectly defined', async () => {
    const event = createTestEvent({
      type: 'identify',
      traits: {
        name: 'Test User',
        email: 'test-user@test-company.com'
      },
      subscriptions: {
        key: 'tester11@seg.com',
        type: 'EMAIL',
        status: 'SUBSCRIBED',
        groups: {
          name: 'Newsletter',
          status: 'SUBSCRIBED'
        }
      },
      userId: 'test-user-ufi5bgkko5',
      anonymousId: 'arky4h2sh7k'
    })

    await expect(
      testDestination.testAction('sendIdentify', {
        event,
        mapping: defaultSubscriptionMapping,
        settings: {
          endpoint: 'incorrect-endpoint'
        }
      })
    ).rejects.toThrowError(InvalidEndpointSelectedThrowableError)
  })

  test('Should send an identify event to Segment', async () => {
    // Mock: Segment Identify Call
    const segmentEndpoint = SEGMENT_ENDPOINTS[DEFAULT_SEGMENT_ENDPOINT].url
    nock(segmentEndpoint).post('/identify').reply(200, { success: true })

    const event = createTestEvent({
      type: 'identify',
      traits: {
        name: 'Test User',
        email: 'test-user@test-company.com'
      },
      subscriptions: {
        key: 'tester11@seg.com',
        type: 'EMAIL',
        status: 'SUBSCRIBED',
        groups: {
          name: 'Newsletter',
          status: 'SUBSCRIBED'
        }
      },
      userId: 'test-user-ufi5bgkko5',
      anonymousId: 'arky4h2sh7k'
    })

    const responses = await testDestination.testAction('sendIdentify', {
      event,
      mapping: defaultSubscriptionMapping,
      settings: {
        endpoint: DEFAULT_SEGMENT_ENDPOINT
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toEqual(200)
    expect(responses[0].options.headers).toMatchSnapshot()
    expect(responses[0].options.json).toMatchSnapshot()
  })
})
