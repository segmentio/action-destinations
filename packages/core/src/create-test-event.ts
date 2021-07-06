import { v4 as uuidv4 } from '@lukeed/uuid'
import type { SegmentEvent } from './segment-event'

export function createTestEvent(event: Partial<SegmentEvent> = {}): SegmentEvent {
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
    properties: {},
    receivedAt: new Date().toISOString(),
    sentAt: new Date().toISOString(),
    timestamp: new Date().toISOString(),
    traits: {},
    type: 'track',
    userId: 'user1234',
    ...event
  }
}
