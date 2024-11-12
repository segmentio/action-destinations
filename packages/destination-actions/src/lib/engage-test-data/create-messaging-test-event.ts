import { v4 as uuidv4 } from '@lukeed/uuid'
import type { SegmentEvent } from '@segment/actions-core'

type SegmentEventWithExternalIds = SegmentEvent & {
  external_ids?: {
    id: string
    type: 'email' | 'phone'
    isSubscribed: boolean | null
    unsubscribeLink?: string
    preferencesLink?: string
    collection: 'users'
    encoding: 'none'
    channelType?: 'sms' | 'whatsapp'
    groups?: {
      id: string
      isSubscribed: boolean | null
      groupUnsubscribeLink?: string
    }[]
  }[]
}

export function createMessagingTestEvent(
  event: Partial<SegmentEventWithExternalIds> = {}
): SegmentEventWithExternalIds {
  return {
    anonymousId: uuidv4(),
    context: {
      ip: '8.8.8.8',
      library: {
        name: 'analytics.js',
        version: '2.11.1'
      },
      locale: 'en-US',
      location: {
        city: 'San Francisco',
        country: 'United States',
        latitude: 40.2964197,
        longitude: -76.9411617,
        speed: 0
      },
      page: {
        path: '/academy/',
        referrer: '',
        search: '',
        title: 'Analytics Academy',
        url: 'https://segment.com/academy/'
      },
      timezone: 'Europe/Amsterdam',
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1'
    },
    event: 'Test Event',
    messageId: uuidv4(),
    properties: {
      firstName: 'First Name',
      lastName: 'Browning'
    },
    receivedAt: new Date().toISOString(),
    sentAt: new Date().toISOString(),
    timestamp: new Date().toISOString(),
    traits: {},
    type: 'track',
    userId: 'user1234',
    external_ids: [
      {
        collection: 'users',
        encoding: 'none',
        groups:
          [
            {
              id: uuidv4(),
              isSubscribed: true,
              groupUnsubscribeLink: 'group_unsubscribe_link'
            }
          ] || undefined,
        id: uuidv4() + '@unittest.com',
        isSubscribed: true,
        type: 'email',
        unsubscribeLink: 'unsubscribe_link',
        preferencesLink: 'preferences_link'
      }
    ],
    ...event
  }
}
