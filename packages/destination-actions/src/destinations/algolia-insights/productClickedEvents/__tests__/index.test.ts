import nock from 'nock'
import { createTestEvent, createTestIntegration, SegmentEvent } from '@segment/actions-core'
import Destination, { ALGOLIA_INSIGHTS_USER_AGENT } from '../../index'
import { AlgoliaProductClickedEvent, BaseAlgoliaInsightsURL } from '../../algolia-insight-api'

const testDestination = createTestIntegration(Destination)

const algoliaDestinationActionSettings = {
  appId: 'algolia-application-id',
  apiKey: 'algolia-api-key'
}
const testAlgoliaDestination = async (event: SegmentEvent): Promise<AlgoliaProductClickedEvent> => {
  nock(BaseAlgoliaInsightsURL).post('/1/events').reply(200, {})
  const segmentEvent = {
    event: { ...event },
    settings: algoliaDestinationActionSettings,
    useDefaultMappings: true
  }
  const actionResponse = await testDestination.testAction('productClickedEvents', segmentEvent)
  const actionRequest = actionResponse[0].request

  expect(actionResponse.length).toBe(1)
  expect(actionRequest.headers.get('X-Algolia-Application-Id')).toBe(algoliaDestinationActionSettings.appId)
  expect(actionRequest.headers.get('X-Algolia-API-Key')).toBe(algoliaDestinationActionSettings.apiKey)
  expect(actionRequest.headers.get('X-Algolia-Agent')).toBe(ALGOLIA_INSIGHTS_USER_AGENT)

  const rawBody = await actionRequest.text()
  return JSON.parse(rawBody)['events'][0]
}

describe('AlgoliaInsights.productClickedEvents', () => {
  it('should submit click on track "Product Clicked" event', async () => {
    const event = createTestEvent({
      type: 'track',
      event: 'Product Clicked',
      properties: {
        query_id: '1234',
        search_index: 'fashion_1',
        product_id: '9876',
        position: 5
      }
    })
    const algoliaEvent = await testAlgoliaDestination(event)

    expect(algoliaEvent.eventName).toBe('Product Clicked')
    expect(algoliaEvent.eventType).toBe('click')
    expect(algoliaEvent.index).toBe(event.properties?.search_index)
    expect(algoliaEvent.userToken).toBe(event.userId)
    expect(algoliaEvent.queryID).toBe(event.properties?.query_id)
    expect(algoliaEvent.objectIDs).toContain('9876')
    expect(algoliaEvent.positions).toContain(5)
  })

  it('should pass timestamp if present', async () => {
    const event = createTestEvent({
      type: 'track',
      event: 'Product Clicked',
      properties: {
        search_index: 'fashion_1',
        product_id: '9876'
      }
    })
    const algoliaEvent = await testAlgoliaDestination(event)
    expect(algoliaEvent.timestamp).toBe(new Date(event.timestamp as string).valueOf())
  })

  it('should pass queryID if present', async () => {
    const event = createTestEvent({
      type: 'track',
      event: 'Product Clicked',
      properties: {
        query_id: '1234',
        search_index: 'fashion_1',
        product_id: '9876'
      }
    })
    const algoliaEvent = await testAlgoliaDestination(event)
    expect(algoliaEvent.queryID).toBe(event.properties?.query_id)
  })

  it('should pass position if present', async () => {
    const event = createTestEvent({
      type: 'track',
      event: 'Product Clicked',
      properties: {
        query_id: '1234',
        search_index: 'fashion_1',
        product_id: '9876',
        position: 5
      }
    })
    const algoliaEvent = await testAlgoliaDestination(event)
    expect(algoliaEvent.positions?.[0]).toBe(event.properties?.position)
  })
})
