import nock from 'nock'
import Definition from '../index'
import type { SegmentEvent } from '@segment/actions-core'
import { createTestIntegration } from '@segment/actions-core'
import { EventType } from '../common/event'
import { EventPayload } from '../common/payload/moloco'
import { v4 as uuidv4 } from '@lukeed/uuid'

const testDestination = createTestIntegration(Definition)
// Home is chosen as a test event type because it does not require any of the optional fields
// Check the requirements in the ../home/index.ts file
const TEST_ACTION_SLUG = 'home'
const TEST_EVENT_TYPE = EventType.Home

const AUTH = {
  platformId: 'foo',
  platformName: 'foo',
  apiKey: 'bar',
  channel_type: 'SITE'
}

describe('Moloco MCM', () => {
  // TEST 1: Test the default mappings. The input event data are automatically collected fields
  // Custom mapping options are not provided so the default mappings are used
  // This tests whether the default mappings are working as expected
  describe('test default mappings for WEB/iOS/Andorid events', () => {
    it('should validate default mappings for WEB event', async () => {
      nock(/.*/).persist().post(/.*/).reply(200)

      // A test event case with automatically collected fields
      // Check the table's ANALYTICS.JS column in the following link
      // https://segment-docs.netlify.app/docs/connections/spec/common/#context-fields-automatically-collected
      const webEvent = {
        anonymousId: 'anonId1234',
        event: 'Test Event',
        messageId: uuidv4(),
        properties: {},
        receivedAt: new Date().toISOString(),
        sentAt: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        traits: {},
        type: 'track',
        userId: 'user1234',
        context: {
          ip: '8.8.8.8',
          library: {
            name: 'analytics.js',
            version: '2.11.1'
          },
          locale: 'en-US',
          page: {
            path: '/academy/',
            referrer: '',
            search: '',
            title: 'Analytics Academy',
            url: 'https://segment.com/academy/'
          },
          userAgent:
            'Mozilla/5.0 (Chrome; intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36'
        }
      } as const

      const expectedPayload: EventPayload = {
        event_type: TEST_EVENT_TYPE,
        id: webEvent.messageId,
        timestamp: webEvent.timestamp,
        channel_type: 'SITE',
        user_id: webEvent.userId,
        device: {
          ua: webEvent.context.userAgent,
          ip: webEvent.context.ip
        },
        session_id: webEvent.anonymousId,
        page_id: webEvent.context.page.path
      }

      const responses = await testDestination.testAction(TEST_ACTION_SLUG, {
        event: webEvent,
        settings: AUTH,
        useDefaultMappings: true,
        mapping: {
          channel_type: 'SITE'
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].options.json).toEqual(expectedPayload)
    })

    it('should validate default mappings for iOS event', async () => {
      nock(/.*/).persist().post(/.*/).reply(200)

      // A test event case with automatically collected fields
      // Check the table's ANALYTICS-IOS column in the following link
      // https://segment-docs.netlify.app/docs/connections/spec/common/#context-fields-automatically-collected
      const iosEvent = {
        anonymousId: 'anonId1234',
        event: 'Test Event',
        messageId: uuidv4(),
        properties: {},
        receivedAt: new Date().toISOString(),
        sentAt: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        traits: {},
        type: 'track',
        userId: 'user1234',
        context: {
          app: {
            name: 'AppName',
            version: '1.0.0',
            build: '1'
          },
          device: {
            type: 'ios',
            id: '12345',
            advertisingId: '12345',
            adTrackingEnabled: true,
            manufacturer: 'Apple',
            model: 'iPhone',
            name: 'iPhone'
          },
          library: {
            name: 'analytics.iOS',
            version: '2.11.1'
          },
          ip: '8.8.8.8',
          locale: 'en-US',
          network: {
            carrier: 'T-Mobile US',
            cellular: true,
            wifi: false
          },
          os: {
            name: 'iOS',
            version: '14.4.2'
          },
          screen: {
            height: 1334,
            width: 750
          },
          traits: {},
          timezone: 'America/Los_Angeles'
        }
      } as const

      const expectedPayload: EventPayload = {
        event_type: TEST_EVENT_TYPE,
        id: iosEvent.messageId,
        timestamp: iosEvent.timestamp,
        channel_type: 'APP',
        user_id: iosEvent.userId,
        device: {
          advertising_id: iosEvent.context.device.advertisingId,
          ip: iosEvent.context.ip,
          model: iosEvent.context.device.model,
          os: iosEvent.context.os.name.toUpperCase(),
          os_version: iosEvent.context.os.version,
          unique_device_id: iosEvent.context.device.id
        },
        session_id: iosEvent.anonymousId
      }

      const responses = await testDestination.testAction(TEST_ACTION_SLUG, {
        event: iosEvent,
        settings: { ...AUTH, channel_type: 'APP' },
        useDefaultMappings: true,
        mapping: {
          channel_type: 'APP'
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].options.json).toEqual(expectedPayload)
    })

    it('should validate default mappings for Andorid event', async () => {
      nock(/.*/).persist().post(/.*/).reply(200)

      // A test event case with automatically collected fields
      // Check the table's ANALYTICS.ANDROID column in the following link
      // https://segment-docs.netlify.app/docs/connections/spec/common/#context-fields-automatically-collected
      const androidEvent = {
        anonymousId: 'anonId1234',
        event: 'Test Event',
        messageId: uuidv4(),
        properties: {},
        receivedAt: new Date().toISOString(),
        sentAt: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        traits: {},
        type: 'track',
        userId: 'user1234',
        context: {
          app: {
            name: 'AppName',
            version: '1.0.0',
            build: '1'
          },
          device: {
            type: 'android',
            id: '12345',
            advertisingId: '12345',
            adTrackingEnabled: true,
            manufacturer: 'Samsung',
            model: 'Galaxy S10',
            name: 'galaxy'
          },
          library: {
            name: 'analytics.ANDROID',
            version: '2.11.1'
          },
          ip: '8.8.8.8',
          locale: 'en-US',
          network: {
            carrier: 'T-Mobile US',
            cellular: true,
            wifi: false,
            bluetooth: false
          },
          os: {
            name: 'Google Android',
            version: '14.4.2'
          },
          screen: {
            height: 1334,
            width: 750,
            density: 2.0
          },
          traits: {},
          userAgent:
            'Mozilla/5.0 (Linux; Android 10; SM-G960U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Mobile Safari/537.36',
          timezone: 'America/Los_Angeles'
        }
      } as const

      const expectedPayload: EventPayload = {
        event_type: TEST_EVENT_TYPE,
        id: androidEvent.messageId,
        timestamp: androidEvent.timestamp,
        channel_type: 'APP',
        user_id: androidEvent.userId,
        device: {
          advertising_id: androidEvent.context.device.advertisingId,
          ip: androidEvent.context.ip,
          model: androidEvent.context.device.model,
          os: androidEvent.context.os.name.toUpperCase(),
          os_version: androidEvent.context.os.version,
          ua: androidEvent.context.userAgent,
          unique_device_id: androidEvent.context.device.id
        },
        session_id: androidEvent.anonymousId
      }

      const responses = await testDestination.testAction(TEST_ACTION_SLUG, {
        event: androidEvent,
        settings: { ...AUTH, channel_type: 'APP' },
        useDefaultMappings: true,
        mapping: {
          channel_type: 'APP'
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].options.json).toEqual(expectedPayload)
    })

    it('should not throw an error even though an input value that a default mapping is pointing is not given', async () => {
      nock(/.*/).persist().post(/.*/).reply(200)

      const event = {
        anonymousId: 'anonId1234',
        event: 'Test Event',
        messageId: uuidv4(),
        properties: {},
        receivedAt: new Date().toISOString(),
        sentAt: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        traits: {},
        type: 'track',
        userId: 'user1234',
        context: {
          // ip: '8.8.8.8', -- ip is not given, but the default mapping is pointing to it
          library: {
            name: 'analytics.js',
            version: '2.11.1'
          },
          locale: 'en-US',
          page: {
            path: '/academy/',
            referrer: '',
            search: '',
            title: 'Analytics Academy',
            url: 'https://segment.com/academy/'
          },
          userAgent:
            'Mozilla/5.0 (Chrome; intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36'
        }
      } as const

      const expectedPayload: EventPayload = {
        event_type: TEST_EVENT_TYPE,
        id: event.messageId,
        timestamp: event.timestamp,
        channel_type: 'SITE',
        user_id: event.userId,
        device: {
          ua: event.context.userAgent
          // ip: event.context.ip, -- absent even though there is a default mapping for it
        },
        session_id: event.anonymousId,
        page_id: event.context.page.path
      }

      const responses = await testDestination.testAction(TEST_ACTION_SLUG, {
        event: event,
        settings: AUTH,
        useDefaultMappings: true,
        mapping: {
          channel_type: 'SITE'
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].options.json).toEqual(expectedPayload)
    })
  })

  // TEST 2: Test the custom mappings. The input event data are automatically collected fields
  // Custom mapping options are provided so the default mappings are not used
  // This tests
  //   1. whether the custom mappings override the default mappings
  //   2. whether array mappings are working as expected, object array should be possible to be created from both object and array
  describe('test custom mapping', () => {
    it('should validate custom mappings, event_id is default to anonymousId, but mapped to eventId', async () => {
      nock(/.*/).persist().post(/.*/).reply(200)

      const event = {
        eventId: 'test-event-id',
        anonymousId: 'anonId1234',
        event: 'Test Event',
        messageId: uuidv4(),
        properties: {},
        receivedAt: new Date().toISOString(),
        sentAt: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        traits: {},
        type: 'track',
        userId: 'user1234',
        context: {
          ip: '8.8.8.8',
          library: {
            name: 'analytics.js',
            version: '2.11.1'
          },
          locale: 'en-US',
          page: {
            path: '/academy/',
            referrer: '',
            search: '',
            title: 'Analytics Academy',
            url: 'https://segment.com/academy/'
          },
          userAgent:
            'Mozilla/5.0 (Chrome; intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36'
        }
      } as const

      const expectedPayload: EventPayload = {
        event_type: TEST_EVENT_TYPE,
        id: event.eventId,
        timestamp: event.timestamp,
        channel_type: 'SITE',
        user_id: event.userId,
        device: {
          ua: event.context.userAgent,
          ip: event.context.ip
        },
        session_id: event.anonymousId,
        page_id: event.context.page.path
      }

      const responses = await testDestination.testAction(TEST_ACTION_SLUG, {
        event: event,
        settings: AUTH,
        useDefaultMappings: true,
        mapping: {
          channel_type: 'SITE',
          event_id: { '@path': '$.eventId' }
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].options.json).toEqual(expectedPayload)
    })

    it('should validate custom mappings, event_id is default to anonymousId, but mapped to eventId', async () => {
      nock(/.*/).persist().post(/.*/).reply(200)

      const event = {
        eventId: 'test-event-id',
        anonymousId: 'anonId1234',
        event: 'Test Event',
        messageId: uuidv4(),
        properties: {},
        receivedAt: new Date().toISOString(),
        sentAt: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        traits: {},
        type: 'track',
        userId: 'user1234',
        context: {
          ip: '8.8.8.8',
          library: {
            name: 'analytics.js',
            version: '2.11.1'
          },
          locale: 'en-US',
          page: {
            path: '/academy/',
            referrer: '',
            search: '',
            title: 'Analytics Academy',
            url: 'https://segment.com/academy/'
          },
          userAgent:
            'Mozilla/5.0 (Chrome; intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36'
        }
      } as const

      const expectedPayload: EventPayload = {
        event_type: TEST_EVENT_TYPE,
        id: event.eventId,
        timestamp: event.timestamp,
        channel_type: 'SITE',
        user_id: event.userId,
        device: {
          ua: event.context.userAgent,
          ip: event.context.ip
        },
        session_id: event.anonymousId,
        page_id: event.context.page.path
      }

      const responses = await testDestination.testAction(TEST_ACTION_SLUG, {
        event: event,
        settings: AUTH,
        useDefaultMappings: true,
        mapping: {
          timestamp: { '@path': '$.timestamp' },
          channel_type: 'SITE',
          event_id: { '@path': '$.eventId' }
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].options.json).toEqual(expectedPayload)
    })

    it('should validate custom mappings for an object array mapping(items). The input IS NOT an array.', async () => {
      nock(/.*/).persist().post(/.*/).reply(200)

      // A test event case with automatically collected fields
      // Check the table's ANALYTICS.ANDROID column in the following link
      // https://segment-docs.netlify.app/docs/connections/spec/common/#context-fields-automatically-collected
      const androidEvent = {
        anonymousId: 'anonId1234',
        event: 'Test Event',
        messageId: uuidv4(),
        properties: {},
        receivedAt: new Date().toISOString(),
        sentAt: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        traits: {},
        type: 'track',
        userId: 'user1234',
        context: {
          product: {
            id: '507f191',
            name: 'Monopoly: 3rd Edition',
            price: 19.99,
            brand: 'Hasbro',
            currency: 'USD'
          },
          app: {
            name: 'AppName',
            version: '1.0.0',
            build: '1'
          },
          device: {
            type: 'android',
            id: '12345',
            advertisingId: '12345',
            adTrackingEnabled: true,
            manufacturer: 'Samsung',
            model: 'Galaxy S10',
            name: 'galaxy'
          },
          library: {
            name: 'analytics.ANDROID',
            version: '2.11.1'
          },
          ip: '8.8.8.8',
          locale: 'en-US',
          network: {
            carrier: 'T-Mobile US',
            cellular: true,
            wifi: false,
            bluetooth: false
          },
          os: {
            name: 'Google Android',
            version: '14.4.2'
          },
          screen: {
            height: 1334,
            width: 750,
            density: 2.0
          },
          traits: {},
          userAgent:
            'Mozilla/5.0 (Linux; Android 10; SM-G960U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Mobile Safari/537.36',
          timezone: 'America/Los_Angeles'
        }
      } as const

      const expectedPayload: EventPayload = {
        event_type: TEST_EVENT_TYPE,
        id: androidEvent.messageId,
        timestamp: androidEvent.timestamp,
        channel_type: 'APP',
        user_id: androidEvent.userId,
        device: {
          advertising_id: androidEvent.context.device.advertisingId,
          ip: androidEvent.context.ip,
          model: androidEvent.context.device.model,
          os: androidEvent.context.os.name.toUpperCase(),
          os_version: androidEvent.context.os.version,
          ua: androidEvent.context.userAgent,
          unique_device_id: androidEvent.context.device.id
        },
        items: [
          {
            id: androidEvent.context.product.id,
            price: {
              amount: androidEvent.context.product.price,
              currency: androidEvent.context.product.currency
            }
          }
        ],
        session_id: androidEvent.anonymousId
      }

      const responses = await testDestination.testAction(TEST_ACTION_SLUG, {
        event: androidEvent,
        settings: { ...AUTH, channel_type: 'APP' },
        useDefaultMappings: true,
        mapping: {
          channel_type: 'APP',
          items: [
            {
              id: { '@path': '$.context.product.id' },
              price: { '@path': '$.context.product.price' },
              currency: { '@path': '$.context.product.currency' }
            }
          ]
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].options.json).toEqual(expectedPayload)
    })

    it('should validate custom mappings for an object array mapping(items). The input IS an array.', async () => {
      nock(/.*/).persist().post(/.*/).reply(200)

      // A test event case with automatically collected fields
      // Check the table's ANALYTICS.ANDROID column in the following link
      // https://segment-docs.netlify.app/docs/connections/spec/common/#context-fields-automatically-collected
      const androidEvent = {
        anonymousId: 'anonId1234',
        event: 'Test Event',
        messageId: uuidv4(),
        properties: {},
        receivedAt: new Date().toISOString(),
        sentAt: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        traits: {},
        type: 'track',
        userId: 'user1234',
        context: {
          product: [
            {
              id: '507f191',
              name: 'Monopoly: 3rd Edition',
              price: 19.99,
              brand: 'Hasbro',
              currency: 'USD'
            },
            {
              id: 'nae2d1',
              name: 'Hogwarts: 3rd Edition',
              price: 29.99,
              brand: 'Hasbro',
              currency: 'USD'
            }
          ],
          app: {
            name: 'AppName',
            version: '1.0.0',
            build: '1'
          },
          device: {
            type: 'android',
            id: '12345',
            advertisingId: '12345',
            adTrackingEnabled: true,
            manufacturer: 'Samsung',
            model: 'Galaxy S10',
            name: 'galaxy'
          },
          library: {
            name: 'analytics.ANDROID',
            version: '2.11.1'
          },
          ip: '8.8.8.8',
          locale: 'en-US',
          network: {
            carrier: 'T-Mobile US',
            cellular: true,
            wifi: false,
            bluetooth: false
          },
          os: {
            name: 'Google Android',
            version: '14.4.2'
          },
          screen: {
            height: 1334,
            width: 750,
            density: 2.0
          },
          traits: {},
          userAgent:
            'Mozilla/5.0 (Linux; Android 10; SM-G960U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Mobile Safari/537.36',
          timezone: 'America/Los_Angeles'
        }
      } as const

      const expectedPayload: EventPayload = {
        event_type: TEST_EVENT_TYPE,
        id: androidEvent.messageId,
        timestamp: androidEvent.timestamp,
        channel_type: 'APP',
        user_id: androidEvent.userId,
        device: {
          advertising_id: androidEvent.context.device.advertisingId,
          ip: androidEvent.context.ip,
          model: androidEvent.context.device.model,
          os: androidEvent.context.os.name.toUpperCase(),
          os_version: androidEvent.context.os.version,
          ua: androidEvent.context.userAgent,
          unique_device_id: androidEvent.context.device.id
        },
        items: [
          {
            id: androidEvent.context.product[0].id,
            price: {
              amount: androidEvent.context.product[0].price,
              currency: androidEvent.context.product[0].currency
            }
          },
          {
            id: androidEvent.context.product[1].id,
            price: {
              amount: androidEvent.context.product[1].price,
              currency: androidEvent.context.product[0].currency
            }
          }
        ],
        session_id: androidEvent.anonymousId
      }

      const responses = await testDestination.testAction(TEST_ACTION_SLUG, {
        event: androidEvent,
        settings: { ...AUTH, channel_type: 'APP' },
        useDefaultMappings: true,
        mapping: {
          channel_type: 'APP',
          items: {
            '@arrayPath': [
              '$.context.product',
              {
                id: { '@path': '$.id' },
                price: { '@path': '$.price' },
                currency: { '@path': '$.currency' }
              }
            ]
          }
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].options.json).toEqual(expectedPayload)
    })

    it('should validate items mapping with currency / when both default currency and currency for each item are given, it should use the latter.', async () => {
      nock(/.*/).persist().post(/.*/).reply(200)

      // A test event case with automatically collected fields
      // Check the table's ANALYTICS.ANDROID column in the following link
      // https://segment-docs.netlify.app/docs/connections/spec/common/#context-fields-automatically-collected
      const androidEvent = {
        anonymousId: 'anonId1234',
        event: 'Test Event',
        messageId: uuidv4(),
        properties: {},
        receivedAt: new Date().toISOString(),
        sentAt: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        traits: {},
        type: 'track',
        userId: 'user1234',
        context: {
          defaultCurrency: 'KRW',
          product: [
            {
              id: '507f191',
              name: 'Monopoly: 3rd Edition',
              price: 19.99,
              brand: 'Hasbro',
              currency: 'USD'
            },
            {
              id: 'nae2d1',
              name: 'Hogwarts: 3rd Edition',
              price: 29.99,
              brand: 'Hasbro',
              currency: 'USD'
            }
          ],
          app: {
            name: 'AppName',
            version: '1.0.0',
            build: '1'
          },
          device: {
            type: 'android',
            id: '12345',
            advertisingId: '12345',
            adTrackingEnabled: true,
            manufacturer: 'Samsung',
            model: 'Galaxy S10',
            name: 'galaxy'
          },
          library: {
            name: 'analytics.ANDROID',
            version: '2.11.1'
          },
          ip: '8.8.8.8',
          locale: 'en-US',
          network: {
            carrier: 'T-Mobile US',
            cellular: true,
            wifi: false,
            bluetooth: false
          },
          os: {
            name: 'Google Android',
            version: '14.4.2'
          },
          screen: {
            height: 1334,
            width: 750,
            density: 2.0
          },
          traits: {},
          userAgent:
            'Mozilla/5.0 (Linux; Android 10; SM-G960U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Mobile Safari/537.36',
          timezone: 'America/Los_Angeles'
        }
      }

      const expectedPayload: EventPayload = {
        event_type: TEST_EVENT_TYPE,
        id: androidEvent.messageId,
        timestamp: androidEvent.timestamp,
        channel_type: 'APP',
        user_id: androidEvent.userId,
        device: {
          advertising_id: androidEvent.context.device.advertisingId,
          ip: androidEvent.context.ip,
          model: androidEvent.context.device.model,
          os: androidEvent.context.os.name.toUpperCase(),
          os_version: androidEvent.context.os.version,
          ua: androidEvent.context.userAgent,
          unique_device_id: androidEvent.context.device.id
        },
        items: [
          {
            id: androidEvent.context.product[0].id,
            price: {
              amount: androidEvent.context.product[0].price,
              currency: androidEvent.context.product[0].currency
            }
          },
          {
            id: androidEvent.context.product[1].id,
            price: {
              amount: androidEvent.context.product[1].price,
              currency: androidEvent.context.product[0].currency
            }
          }
        ],
        session_id: androidEvent.anonymousId
      }

      const responses = await testDestination.testAction(TEST_ACTION_SLUG, {
        event: androidEvent as SegmentEvent,
        settings: { ...AUTH, channel_type: 'APP' },
        useDefaultMappings: true,
        mapping: {
          timestamp: { '@path': '$.timestamp' },
          channel_type: 'APP',
          default_currency: { '@path': '$.context.defaultCurrency' },
          items: {
            '@arrayPath': [
              '$.context.product',
              {
                id: { '@path': '$.id' },
                price: { '@path': '$.price' },
                currency: { '@path': '$.currency' }
              }
            ]
          }
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].options.json).toEqual(expectedPayload)
    })

    it('should validate items mapping with currency / only default currency is given and it is used for each item.', async () => {
      nock(/.*/).persist().post(/.*/).reply(200)

      // A test event case with automatically collected fields
      // Check the table's ANALYTICS.ANDROID column in the following link
      // https://segment-docs.netlify.app/docs/connections/spec/common/#context-fields-automatically-collected
      const androidEvent = {
        anonymousId: 'anonId1234',
        event: 'Test Event',
        messageId: uuidv4(),
        properties: {},
        receivedAt: new Date().toISOString(),
        sentAt: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        traits: {},
        type: 'track',
        userId: 'user1234',
        context: {
          defaultCurrency: 'JPY',
          product: [
            {
              id: '507f191',
              name: 'Monopoly: 3rd Edition',
              price: 19.99,
              brand: 'Hasbro'
            },
            {
              id: 'nae2d1',
              name: 'Hogwarts: 3rd Edition',
              price: 29.99,
              brand: 'Hasbro'
            }
          ],
          app: {
            name: 'AppName',
            version: '1.0.0',
            build: '1'
          },
          device: {
            type: 'android',
            id: '12345',
            advertisingId: '12345',
            adTrackingEnabled: true,
            manufacturer: 'Samsung',
            model: 'Galaxy S10',
            name: 'galaxy'
          },
          library: {
            name: 'analytics.ANDROID',
            version: '2.11.1'
          },
          ip: '8.8.8.8',
          locale: 'en-US',
          network: {
            carrier: 'T-Mobile US',
            cellular: true,
            wifi: false,
            bluetooth: false
          },
          os: {
            name: 'Google Android',
            version: '14.4.2'
          },
          screen: {
            height: 1334,
            width: 750,
            density: 2.0
          },
          traits: {},
          userAgent:
            'Mozilla/5.0 (Linux; Android 10; SM-G960U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Mobile Safari/537.36',
          timezone: 'America/Los_Angeles'
        }
      }

      const expectedPayload: EventPayload = {
        event_type: TEST_EVENT_TYPE,
        id: androidEvent.messageId,
        timestamp: androidEvent.timestamp,
        channel_type: 'APP',
        user_id: androidEvent.userId,
        device: {
          advertising_id: androidEvent.context.device.advertisingId,
          ip: androidEvent.context.ip,
          model: androidEvent.context.device.model,
          os: androidEvent.context.os.name.toUpperCase(),
          os_version: androidEvent.context.os.version,
          ua: androidEvent.context.userAgent,
          unique_device_id: androidEvent.context.device.id
        },
        items: [
          {
            id: androidEvent.context.product[0].id,
            price: {
              amount: androidEvent.context.product[0].price,
              currency: androidEvent.context.defaultCurrency
            }
          },
          {
            id: androidEvent.context.product[1].id,
            price: {
              amount: androidEvent.context.product[1].price,
              currency: androidEvent.context.defaultCurrency
            }
          }
        ],
        session_id: androidEvent.anonymousId
      }

      const responses = await testDestination.testAction(TEST_ACTION_SLUG, {
        event: androidEvent as SegmentEvent,
        settings: { ...AUTH, channel_type: 'APP' },
        useDefaultMappings: true,
        mapping: {
          timestamp: { '@path': '$.timestamp' },
          channel_type: 'APP',
          default_currency: { '@path': '$.context.defaultCurrency' },
          items: {
            '@arrayPath': [
              '$.context.product',
              {
                id: { '@path': '$.id' },
                price: { '@path': '$.price' },
                currency: { '@path': '$.currency' }
              }
            ]
          }
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].options.json).toEqual(expectedPayload)
    })

    it('should validate the page_id conversion when both "page_id" and "page_identifier_tokens" are given ("page_id" should be used).', async () => {
      nock(/.*/).persist().post(/.*/).reply(200)

      // A test event case with automatically collected fields
      // Check the table's ANALYTICS.ANDROID column in the following link
      // https://segment-docs.netlify.app/docs/connections/spec/common/#context-fields-automatically-collected
      const event = {
        pageId: 'page-id-1234',
        anonymousId: 'anonId1234',
        event: 'Test Event',
        messageId: uuidv4(),
        properties: {},
        receivedAt: new Date().toISOString(),
        sentAt: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        traits: {},
        type: 'track',
        userId: 'user1234',
        context: {
          app: {
            name: 'AppName',
            version: '1.0.0',
            build: '1'
          },
          device: {
            type: 'android',
            id: '12345',
            advertisingId: '12345',
            adTrackingEnabled: true,
            manufacturer: 'Samsung',
            model: 'Galaxy S10',
            name: 'galaxy'
          },
          library: {
            name: 'analytics.ANDROID',
            version: '2.11.1'
          },
          ip: '8.8.8.8',
          locale: 'en-US',
          network: {
            carrier: 'T-Mobile US',
            cellular: true,
            wifi: false,
            bluetooth: false
          },
          os: {
            name: 'Google Android',
            version: '14.4.2'
          },
          screen: {
            height: 1334,
            width: 750,
            density: 2.0
          },
          traits: {},
          userAgent:
            'Mozilla/5.0 (Linux; Android 10; SM-G960U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Mobile Safari/537.36',
          timezone: 'America/Los_Angeles',
          event: 'Product List Viewed',
          vertical: 'fruit'
        }
      } as const

      const expectedPayload: EventPayload = {
        event_type: TEST_EVENT_TYPE,
        id: event.messageId,
        timestamp: event.timestamp,
        channel_type: 'APP',
        user_id: event.userId,
        device: {
          advertising_id: event.context.device.advertisingId,
          ip: event.context.ip,
          model: event.context.device.model,
          os: event.context.os.name.toUpperCase(),
          os_version: event.context.os.version,
          ua: event.context.userAgent,
          unique_device_id: event.context.device.id
        },
        page_id: event.pageId, // -- still uses the pageId
        session_id: event.anonymousId
      }

      const responses = await testDestination.testAction(TEST_ACTION_SLUG, {
        event: event,
        settings: { ...AUTH, channel_type: 'APP' },
        useDefaultMappings: true,
        mapping: {
          timestamp: { '@path': '$.timestamp' },
          channel_type: 'APP',
          page_id: { '@path': '$.pageId' },
          page_identifier_tokens: {
            event: { '@path': '$.context.event' },
            vertical: { '@path': '$.context.vertical' }
          }
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].options.json).toEqual(expectedPayload)
    })

    it('should validate the page_id conversion when only "page_identifier_tokens" is given.', async () => {
      nock(/.*/).persist().post(/.*/).reply(200)

      // A test event case with automatically collected fields
      // Check the table's ANALYTICS.ANDROID column in the following link
      // https://segment-docs.netlify.app/docs/connections/spec/common/#context-fields-automatically-collected
      const event = {
        pageId: 'page-id-1234',
        anonymousId: 'anonId1234',
        event: 'Test Event',
        messageId: uuidv4(),
        properties: {},
        receivedAt: new Date().toISOString(),
        sentAt: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        traits: {},
        type: 'track',
        userId: 'user1234',
        context: {
          app: {
            name: 'AppName',
            version: '1.0.0',
            build: '1'
          },
          device: {
            type: 'android',
            id: '12345',
            advertisingId: '12345',
            adTrackingEnabled: true,
            manufacturer: 'Samsung',
            model: 'Galaxy S10',
            name: 'galaxy'
          },
          library: {
            name: 'analytics.ANDROID',
            version: '2.11.1'
          },
          ip: '8.8.8.8',
          locale: 'en-US',
          network: {
            carrier: 'T-Mobile US',
            cellular: true,
            wifi: false,
            bluetooth: false
          },
          os: {
            name: 'Google Android',
            version: '14.4.2'
          },
          screen: {
            height: 1334,
            width: 750,
            density: 2.0
          },
          traits: {},
          userAgent:
            'Mozilla/5.0 (Linux; Android 10; SM-G960U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Mobile Safari/537.36',
          timezone: 'America/Los_Angeles',
          event: 'Product List Viewed',
          vertical: 'fruit'
        }
      } as const

      const expectedPayload: EventPayload = {
        event_type: TEST_EVENT_TYPE,
        id: event.messageId,
        timestamp: event.timestamp,
        channel_type: 'APP',
        user_id: event.userId,
        device: {
          advertising_id: event.context.device.advertisingId,
          ip: event.context.ip,
          model: event.context.device.model,
          os: event.context.os.name.toUpperCase(),
          os_version: event.context.os.version,
          ua: event.context.userAgent,
          unique_device_id: event.context.device.id
        },
        page_id: 'event:Product List Viewed;vertical:fruit', // stringified from pageIdentifierTokens
        session_id: event.anonymousId
      }

      const responses = await testDestination.testAction(TEST_ACTION_SLUG, {
        event: event,
        settings: { ...AUTH, channel_type: 'APP' },
        useDefaultMappings: true,
        mapping: {
          timestamp: { '@path': '$.timestamp' },
          channel_type: 'APP',
          // pageId: { '@path': '$.pageId' }, -- no mapping for page_id
          page_identifier_tokens: {
            event: { '@path': '$.context.event' },
            vertical: { '@path': '$.context.vertical' }
          }
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].options.json).toEqual(expectedPayload)
    })
  })
})
