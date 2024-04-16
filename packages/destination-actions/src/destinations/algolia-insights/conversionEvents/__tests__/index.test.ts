import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination, { ALGOLIA_INSIGHTS_USER_AGENT } from '../../index'
import { AlgoliaConversionEvent, BaseAlgoliaInsightsURL } from '../../algolia-insight-api'
import { SegmentEvent } from '@segment/actions-core'

const testDestination = createTestIntegration(Destination)

const algoliaDestinationActionSettings = {
  appId: 'algolia-application-id',
  apiKey: 'algolia-api-key'
}
const testAlgoliaDestination = async (event: SegmentEvent): Promise<AlgoliaConversionEvent> => {
  nock(BaseAlgoliaInsightsURL).post('/1/events').reply(200, {})
  const segmentEvent = {
    event: { ...event },
    settings: algoliaDestinationActionSettings,
    useDefaultMappings: true
  }
  const actionResponse = await testDestination.testAction('conversionEvents', segmentEvent)
  const actionRequest = actionResponse[0].request

  expect(actionResponse.length).toBe(1)
  expect(actionRequest.headers.get('X-Algolia-Application-Id')).toBe(algoliaDestinationActionSettings.appId)
  expect(actionRequest.headers.get('X-Algolia-API-Key')).toBe(algoliaDestinationActionSettings.apiKey)
  expect(actionRequest.headers.get('X-Algolia-Agent')).toBe(ALGOLIA_INSIGHTS_USER_AGENT)

  const rawBody = await actionRequest.text()
  return JSON.parse(rawBody)['events'][0]
}

describe('AlgoliaInsights.conversionEvents', () => {
  it('should submit conversion on track "Order Completed" event', async () => {
    const event = createTestEvent({
      type: 'track',
      event: 'Order Completed',
      properties: {
        query_id: '1234',
        search_index: 'fashion_1',
        products: [
          {
            product_id: '9876',
            product_name: 'skirt 1'
          },
          {
            product_id: '5432',
            product_name: 'skirt 2'
          }
        ]
      }
    })
    const algoliaEvent = await testAlgoliaDestination(event)

    expect(algoliaEvent.eventName).toBe('Conversion Event')
    expect(algoliaEvent.eventType).toBe('conversion')
    expect(algoliaEvent.eventSubtype).toBe('purchase')
    expect(algoliaEvent.index).toBe(event.properties?.search_index)
    expect(algoliaEvent.userToken).toBe(event.userId)
    expect(algoliaEvent.objectIDs).toContain('9876')
    expect(algoliaEvent.objectIDs).toContain('5432')
  })

  it('should pass timestamp if present', async () => {
    const event = createTestEvent({
      type: 'track',
      event: 'Order Completed',
      properties: {
        search_index: 'fashion_1',
        products: [
          {
            product_id: '9876',
            product_name: 'skirt 1'
          },
          {
            product_id: '5432',
            product_name: 'skirt 2'
          }
        ]
      }
    })
    const algoliaEvent = await testAlgoliaDestination(event)
    expect(algoliaEvent.timestamp).toBe(new Date(event.timestamp as string).valueOf())
  })

  it('should pass queryID if present', async () => {
    const event = createTestEvent({
      type: 'track',
      event: 'Order Completed',
      properties: {
        query_id: '1234',
        search_index: 'fashion_1',
        products: [
          {
            product_id: '9876',
            product_name: 'skirt 1'
          },
          {
            product_id: '5432',
            product_name: 'skirt 2'
          }
        ]
      }
    })
    const algoliaEvent = await testAlgoliaDestination(event)
    expect(algoliaEvent.queryID).toBe(event.properties?.query_id)
  })

  it('should pass value if present', async () => {
    const event = createTestEvent({
      type: 'track',
      event: 'Order Completed',
      properties: {
        query_id: '1234',
        search_index: 'fashion_1',
        products: [
          {
            product_id: '9876',
            product_name: 'skirt 1'
          },
          {
            product_id: '5432',
            product_name: 'skirt 2'
          }
        ],
        value: 200
      }
    })
    const algoliaEvent = await testAlgoliaDestination(event)
    expect(algoliaEvent.value).toBe(200)
  })

  it('should pass currency if present', async () => {
    const event = createTestEvent({
      type: 'track',
      event: 'Order Completed',
      properties: {
        query_id: '1234',
        search_index: 'fashion_1',
        products: [
          {
            product_id: '9876',
            product_name: 'skirt 1'
          },
          {
            product_id: '5432',
            product_name: 'skirt 2'
          }
        ],
        currency: 'AUD'
      }
    })
    const algoliaEvent = await testAlgoliaDestination(event)
    expect(algoliaEvent.currency).toBe('AUD')
  })

  describe('should pass product price data if present', () => {
    it('all products contain all price properties', async () => {
      const event = createTestEvent({
        type: 'track',
        event: 'Order Completed',
        properties: {
          query_id: '1234',
          search_index: 'fashion_1',
          products: [
            {
              product_id: '9876',
              product_name: 'skirt 1',
              price: 105.99,
              discount: 22.99,
              quantity: 5
            },
            {
              product_id: '5432',
              product_name: 'skirt 2',
              price: 0.6,
              discount: 0.1,
              quantity: 2
            }
          ]
        }
      })
      const algoliaEvent = await testAlgoliaDestination(event)
      expect(algoliaEvent.objectIDs).toEqual(['9876', '5432'])
      expect(algoliaEvent.objectData).toEqual([
        { price: 105.99, discount: 22.99, quantity: 5 },
        { price: 0.6, discount: 0.1, quantity: 2 }
      ])
    })

    it('some products contain some price properties', async () => {
      const event = createTestEvent({
        type: 'track',
        event: 'Order Completed',
        properties: {
          query_id: '1234',
          search_index: 'fashion_1',
          products: [
            {
              product_id: '9876',
              product_name: 'skirt 1',
              price: 105.99,
              quantity: 5
            },
            {
              product_id: '9212',
              product_name: 'dress 1',
              price: 299.99,
              discount: 12.99
            }
          ]
        }
      })
      const algoliaEvent = await testAlgoliaDestination(event)
      expect(algoliaEvent.objectIDs).toEqual(['9876', '9212'])
      expect(algoliaEvent.objectData).toEqual([
        { price: 105.99, quantity: 5 },
        { price: 299.99, discount: 12.99 }
      ])
    })

    it('some products contain no price properties', async () => {
      const event = createTestEvent({
        type: 'track',
        event: 'Order Completed',
        properties: {
          query_id: '1234',
          search_index: 'fashion_1',
          products: [
            {
              product_id: '9876',
              product_name: 'skirt 1',
              price: 105.99,
              discount: 22.99,
              quantity: 5
            },
            {
              product_id: '5432',
              product_name: 'skirt 2'
            },
            {
              product_id: '9212',
              product_name: 'dress 1',
              price: 299.99,
              discount: 12.99
            }
          ]
        }
      })
      const algoliaEvent = await testAlgoliaDestination(event)
      expect(algoliaEvent.objectIDs).toEqual(['9876', '5432', '9212'])
      expect(algoliaEvent.objectData).toEqual([
        { price: 105.99, discount: 22.99, quantity: 5 },
        {},
        { price: 299.99, discount: 12.99 }
      ])
    })

    it('no products contain price properties', async () => {
      const event = createTestEvent({
        type: 'track',
        event: 'Order Completed',
        properties: {
          query_id: '1234',
          search_index: 'fashion_1',
          products: [
            {
              product_id: '9876'
            },
            {
              product_id: '5432'
            }
          ]
        }
      })
      const algoliaEvent = await testAlgoliaDestination(event)
      expect(algoliaEvent.objectIDs).toEqual(['9876', '5432'])
      expect(algoliaEvent.objectData).toBeUndefined()
    })
  })
})
