import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import {
  MissingExternalIdsError,
  MissingIosPushTokenIfIosPushSubscriptionIsPresentError,
  MissingSubscriptionStatusesError
} from '../../errors'
import { DEFAULT_SEGMENT_ENDPOINT } from '../../properties'

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
  engage_space: 'engage-space-writekey',
  timestamp: {
    '@path': '$.timestamp'
  }
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
        },
        settings: {
          endpoint: DEFAULT_SEGMENT_ENDPOINT
        }
      })
    ).rejects.toThrowError(MissingExternalIdsError)
  })

  test('Should throw an error if `email` or `phone` or `Android_Push_Token` or `Ios_Push_Token` is not defined', async () => {
    const event = createTestEvent({
      traits: {
        name: 'Test User',
        email: 'test-user@test-company.com'
      }
    })

    await expect(
      testDestination.testAction('sendSubscription', {
        event,
        mapping: defaultSubscriptionMapping,
        settings: {
          endpoint: DEFAULT_SEGMENT_ENDPOINT
        }
      })
    ).rejects.toThrowError(MissingExternalIdsError)
  })

  test('Should throw an error if `email` or `phone` or `android_push_token` or `ios_push_token` is defined without a subscription status', async () => {
    const event = createTestEvent({
      traits: {
        name: 'Test User',
        email: 'test-user@test-company.com'
      },
      properties: {
        email: 'tester11@seg.com',
        phone: '+12135618345',
        ios_push_token: 'abcd12bbfjfsykdbvbvvvvvv'
      }
    })

    await expect(
      testDestination.testAction('sendSubscription', {
        event,
        mapping: defaultSubscriptionMapping,
        settings: {
          endpoint: DEFAULT_SEGMENT_ENDPOINT
        }
      })
    ).rejects.toThrowError(MissingSubscriptionStatusesError)
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
        mapping: defaultSubscriptionMapping,
        settings: {
          endpoint: DEFAULT_SEGMENT_ENDPOINT
        }
      })
    ).rejects.toThrowError(MissingIosPushTokenIfIosPushSubscriptionIsPresentError)
  })

  test('Should return transformed event when subscription groups are defined', async () => {
    const event = createTestEvent({
      traits: {
        name: 'Test User',
        email: 'test-user@test-company.com'
      },
      timestamp: '2023-10-10T07:24:07.036Z',
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

    const results = testDestination.results

    expect(responses.length).toBe(0)
    expect(results.length).toBe(3)
    expect(results[2].data).toMatchSnapshot()
  })

  test('Should return transformed event', async () => {
    const event = createTestEvent({
      traits: {
        name: 'Test User',
        email: 'test-user@test-company.com'
      },
      timestamp: '2023-10-10T07:24:07.036Z',
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
