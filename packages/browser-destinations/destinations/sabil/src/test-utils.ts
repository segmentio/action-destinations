import { Subscription } from '@segment/browser-destination-runtime/types'

export const TEST_CLIENT_ID = 'c8d82ede-c8e4-4bd0-8240-5c723f83fe3f'
export const TEST_USER_ID = 'segment_test_user_id'

export const subscriptions: Subscription[] = [
  {
    partnerAction: 'attach',
    name: 'Attach',
    enabled: true,
    subscribe: 'type = "identify"',
    mapping: {
      user_id: {
        '@path': '$.userId'
      }
    }
  }
]
