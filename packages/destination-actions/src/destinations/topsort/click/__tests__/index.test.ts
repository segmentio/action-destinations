import nock from 'nock'
import { AggregateAjvError } from '@segment/ajv-human-errors'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import type { SegmentEvent } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('Topsort.click', () => {
  it('should be successful with default mappings and resolvedBidId', async () => {
    nock(/.*/).persist().post(/.*/).reply(200)

    const event = createTestEvent({
      properties: {
        resolvedBidId: 'thisisaresolvedbidid'
      }
    })

    const responses = await testDestination.testAction('click', {
      event,
      settings: {
        api_key: 'bar'
      },
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.headers).toMatchSnapshot()
    expect(responses[0].options.json).toMatchObject({
      clicks: expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          resolvedBidId: 'thisisaresolvedbidid',
          occurredAt: expect.any(String),
          opaqueUserId: expect.any(String)
        })
      ])
    })
  })

  it('should be successful with additional attribution', async () => {
    nock(/.*/).persist().post(/.*/).reply(200)

    const event = createTestEvent({
      properties: {
        additionalAttribution: { id: '123', type: 'user' },
        resolvedBidId: 'thisisaresolvedbidid'
      }
    })

    const responses = await testDestination.testAction('click', {
      event,
      settings: {
        api_key: 'bar'
      },
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.headers).toMatchSnapshot()
    expect(responses[0].options.json).toMatchObject({
      clicks: expect.arrayContaining([
        expect.objectContaining({
          additionalAttribution: { id: '123', type: 'user' }
        })
      ])
    })
  })

  it('should fail because it misses a required field (resolvedBidId)', async () => {
    nock(/.*/).persist().post(/.*/).reply(200)

    const event = createTestEvent({})

    await expect(
      testDestination.testAction('click', {
        event,
        settings: {
          api_key: 'bar'
        },
        useDefaultMappings: true
      })
    ).rejects.toThrowError(AggregateAjvError)
  })

  it('should be successful with new optional fields', async () => {
    nock(/.*/).persist().post(/.*/).reply(200)

    const event = createClickEvent({
      messageId: 'test-message-y0dt0hyf3x',
      timestamp: '2025-11-12T16:33:07.760Z',
      type: 'track',
      position: 1,
      properties: {
        resolvedBidId:
          'SSMwRQoQBpE1CGG5cUmYBIh_O32g2hIQAZpWyyspdBKykINT91tvrxoQAZT62y7od6KOGfcUSYiZjiIICgQ3NjQ2EAEwyadxQOX0BkgBUOOXypunMw',
        additionalAttribution: {
          id: 'entity-id-456',
          type: 'product'
        },
        externalVendorId: 'vendor-123',
        entity: {
          id: 'entity-id-456',
          type: 'product'
        },
        placement: {
          page: 1,
          pageSize: 20,
          productId: 'product-pdp-999',
          categoryIds: ['cat1', 'cat2'],
          searchQuery: 'test search query'
        },
        page: {
          type: 'search',
          pageId: 'search-results-page-123'
        },
        object: {
          type: 'listing',
          clickType: 'product'
        },
        channel: 'onsite'
      },
      userId: 'test-user-9c8y3pgoj3',
      event: 'Product Clicked',
      anonymousId: 'au9awm036xq',
      context: {
        active: true,
        app: {
          name: 'InitechGlobal',
          version: '545',
          build: '3.0.1.545',
          namespace: 'com.production.segment'
        },
        campaign: {
          name: 'TPS Innovation Newsletter',
          source: 'Newsletter',
          medium: 'email',
          term: 'tps reports',
          content: 'image link'
        },
        device: {
          id: 'B5372DB0-C21E-11E4-8DFC-AA07A5B093DB',
          advertisingId: '7A3CBEA0-BDF5-11E4-8DFC-AA07A5B093DB',
          adTrackingEnabled: true,
          manufacturer: 'Apple',
          model: 'iPhone7,2',
          name: 'maguro',
          type: 'macos',
          token: 'token'
        },
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
        network: {
          bluetooth: false,
          carrier: 'T-Mobile US',
          cellular: true,
          wifi: false
        },
        os: {
          name: 'iPhone OS',
          version: '8.1.3'
        },
        page: {
          path: 'This should work',
          referrer: '',
          search: '',
          title: 'Analytics Academy',
          url: 'https://segment.com/academy/'
        },
        screen: {
          width: 320,
          height: 568,
          density: 2
        },
        groupId: '12345',
        timezone: 'Europe/Amsterdam',
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1'
      },
      receivedAt: '2025-11-12T16:33:07.760Z',
      sentAt: '2025-11-12T16:33:07.760Z',
      version: 2
    })

    const responses = await testDestination.testAction('impression', {
      event,
      settings: {
        api_key: 'bar'
      },
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.headers).toMatchSnapshot()
    expect(responses[0].options.json).toMatchObject({
      impressions: expect.arrayContaining([
        expect.objectContaining({
          id: 'test-message-y0dt0hyf3x',
          occurredAt: '2025-11-12T16:33:07.760Z',
          opaqueUserId: 'au9awm036xq',
          resolvedBidId:
            'SSMwRQoQBpE1CGG5cUmYBIh_O32g2hIQAZpWyyspdBKykINT91tvrxoQAZT62y7od6KOGfcUSYiZjiIICgQ3NjQ2EAEwyadxQOX0BkgBUOOXypunMw',
          additionalAttribution: {
            id: 'entity-id-456',
            type: 'product'
          },
          externalVendorId: 'vendor-123',
          entity: {
            id: 'entity-id-456',
            type: 'product'
          },
          placement: {
            path: 'This should work',
            position: 1,
            page: 1,
            pageSize: 20,
            productId: 'product-pdp-999',
            categoryIds: ['cat1', 'cat2'],
            searchQuery: 'test search query'
          },
          page: {
            value: 'Analytics Academy',
            type: 'search',
            pageId: 'search-results-page-123'
          },
          object: {
            type: 'listing',
            clickType: 'product'
          },
          deviceType: 'desktop',
          channel: 'onsite'
        })
      ])
    })
  })
})

function createClickEvent(event = {}): SegmentEvent {
  return {
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
    event: 'Product Clicked',
    properties: {},
    receivedAt: new Date().toISOString(),
    sentAt: new Date().toISOString(),
    timestamp: new Date().toISOString(),
    type: 'track',
    userId: 'user1234',
    ...event
  }
}
