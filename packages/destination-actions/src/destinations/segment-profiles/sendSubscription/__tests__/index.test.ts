import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import {
  InvalidEndpointSelectedThrowableError,
  MissingEmailOrPhoneThrowableError,
  MissingEmailSmsOrWhatsappSubscriptionIfEmailPhoneIsPresentThrowableError,
  MissingIosPushTokenIfIosPushSubscriptionIsPresentThrowableError,
  MissingUserOrAnonymousIdThrowableError
} from '../../errors'
import { DEFAULT_SEGMENT_ENDPOINT, SEGMENT_ENDPOINTS } from '../../properties'

const testDestination = createTestIntegration(Destination)

beforeEach(() => nock.cleanAll())

// Default Subscription Mapping
export const defaultSubscriptionMapping = {
  user_id: {
    '@path': '$.userId'
  },
  anonymous_id: {
    '@path': '$.anonymousId'
  },
  traits: {
    '@path': '$.traits'
  },
  email: {
    '@path': '$.properties.email'
  },
  email_subscription_status: {
    '@path': '$.properties.email_subscription_status'
  },
  subscriptionGroups: {
    '@path': '$.properties.subscription_groups'
  },
  phone: {
    '@path': '$.properties.phone'
  },
  sms_subscription_status: {
    '@path': '$.properties.sms_subscription_status'
  },
  whatsapp_subscription_status: {
    '@path': '$.properties.whatsapp_subscription_status'
  },
  ios_push_token: {
    '@path': '$.properties.ios_push_token'
  },
  ios_push_subscription_status: {
    '@path': '$.properties.ios_push_subscription_status'
  },
  android_push_token: {
    '@path': '$.properties.android_push_token'
  },
  android_push_subscription_status: {
    '@path': '$.properties.android_push_subscription_status'
  },
  engage_space: 'engage-space-writekey'
}
describe('SegmentProfiles.sendSubscription', () => {
  test('Should throw an error if `userId` or `anonymousId` is not defined', async () => {
    const event = createTestEvent({
      traits: {
        name: 'Test User',
        email: 'test-user@test-company.com'
      },
      properties: {
        email: 'tester11@seg.com',
        email_subscription_status: 'unsubscribed'
      }
    })

    await expect(
      testDestination.testAction('sendSubscription', {
        event,
        mapping: {
          engage_space: 'engage-space-writekey',
          defaultSubscriptionMapping
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
      properties: {
        email: 'tester11@seg.com',
        email_subscription_status: 'unsubscribed'
      }
    })

    await expect(
      testDestination.testAction('sendSubscription', {
        event,
        mapping: defaultSubscriptionMapping,
        settings: {
          endpoint: 'incorrect-endpoint'
        }
      })
    ).rejects.toThrowError(InvalidEndpointSelectedThrowableError)
  })

  test('Should throw an error if `email` or `phone` is not defined', async () => {
    const event = createTestEvent({
      traits: {
        name: 'Test User',
        email: 'test-user@test-company.com'
      }
    })

    await expect(
      testDestination.testAction('sendSubscription', {
        event,
        mapping: defaultSubscriptionMapping
      })
    ).rejects.toThrowError(MissingEmailOrPhoneThrowableError)
  })

  test('Should throw an error if `email` or `phone` is defined without a subscription status', async () => {
    const event = createTestEvent({
      traits: {
        name: 'Test User',
        email: 'test-user@test-company.com'
      },
      properties: {
        email: 'tester11@seg.com',
        phone: '+12135618345'
      }
    })

    await expect(
      testDestination.testAction('sendSubscription', {
        event,
        mapping: defaultSubscriptionMapping
      })
    ).rejects.toThrowError(MissingEmailSmsOrWhatsappSubscriptionIfEmailPhoneIsPresentThrowableError)
  })

  test('Should throw an error if `Ios_Push_Subscription` is defined without a`ios_push_token`', async () => {
    const event = createTestEvent({
      traits: {
        name: 'Test User',
        email: 'test-user@test-company.com'
      },
      properties: {
        email: 'tester11@seg.com',
        email_subscription_status: 'true',
        phone: '+12135618345',
        ios_push_subscription_status: 'true'
      }
    })

    await expect(
      testDestination.testAction('sendSubscription', {
        event,
        mapping: defaultSubscriptionMapping
      })
    ).rejects.toThrowError(MissingIosPushTokenIfIosPushSubscriptionIsPresentThrowableError)
  })

  test('Should send a subscription event to Segment when subscription groups are defined', async () => {
    // Mock: Segment Identify Call
    const segmentEndpoint = SEGMENT_ENDPOINTS[DEFAULT_SEGMENT_ENDPOINT].url
    nock(segmentEndpoint).post('/identify').reply(200, { success: true })
    const event = createTestEvent({
      traits: {
        name: 'Test User',
        email: 'test-user@test-company.com'
      },
      properties: {
        email: 'tester11@seg.com',
        email_subscription_status: 'true',
        subscription_groups: {
          marketing: 'true',
          ProductUpdates: '',
          newsletter: 'false'
        },
        ios_push_token: 'abcd12bbfjfsykdbvbvvvvvv',
        ios_push_subscription_status: 'true'
      }
    })

    const responses = await testDestination.testAction('sendSubscription', {
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

  test('Should send a subscription event to Segment', async () => {
    // Mock: Segment Identify Call
    const segmentEndpoint = SEGMENT_ENDPOINTS[DEFAULT_SEGMENT_ENDPOINT].url
    nock(segmentEndpoint).post('/identify').reply(200, { success: true })

    const event = createTestEvent({
      traits: {
        name: 'Test User',
        email: 'test-user@test-company.com'
      },
      properties: {
        email: 'tester11@seg.com',
        email_subscription_status: 'true',
        phone: '+12135618345',
        sms_subscription_status: 'true',
        whatsapp_subscription_status: 'true',
        subscription_groups: {
          marketing: 'true',
          ProductUpdates: '',
          newsletter: 'false'
        },
        android_push_token: 'abcd12bbfygdbvbvvvv',
        android_push_subscription_status: 'false',
        ios_push_token: 'abcd12bbfjfsykdbvbvvvvvv',
        ios_push_subscription_status: 'true'
      }
    })

    const responses = await testDestination.testAction('sendSubscription', {
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

  test('Should not send event if actions-segment-profiles-tapi-internal-enabled flag is enabled', async () => {
    const event = createTestEvent({
      traits: {
        name: 'Test User',
        email: 'test-user@test-company.com'
      },
      properties: {
        email: 'tester11@seg.com',
        email_subscription_status: 'true',
        phone: '+12135618345',
        sms_subscription_status: 'true',
        whatsapp_subscription_status: 'true',
        subscription_groups: {
          marketing: 'true',
          ProductUpdates: '',
          newsletter: 'false'
        },
        android_push_token: 'abcd12bbfygdbvbvvvv',
        android_push_subscription_status: 'false',
        ios_push_token: 'abcd12bbfjfsykdbvbvvvvvv',
        ios_push_subscription_status: 'true',
        userId: 'test-user-ufi5bgkko5',
        anonymousId: 'arky4h2sh7k'
      }
    })

    const responses = await testDestination.testAction('sendSubscription', {
      event,
      mapping: defaultSubscriptionMapping,
      settings: {
        endpoint: DEFAULT_SEGMENT_ENDPOINT
      },
      features: {
        'actions-segment-profiles-tapi-internal-enabled': true
      }
    })
    const results = testDestination.results

    expect(responses.length).toBe(0)
    expect(results.length).toBe(3)
    expect(results[2].data).toMatchSnapshot()
  })
})
