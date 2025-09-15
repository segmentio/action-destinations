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
  const actionResponse = await testDestination.testAction('productAddedEvents', segmentEvent)
  const actionRequest = actionResponse[0].request

  expect(actionResponse.length).toBe(1)
  expect(actionRequest.headers.get('X-Algolia-Application-Id')).toBe(algoliaDestinationActionSettings.appId)
  expect(actionRequest.headers.get('X-Algolia-API-Key')).toBe(algoliaDestinationActionSettings.apiKey)
  expect(actionRequest.headers.get('X-Algolia-Agent')).toBe(ALGOLIA_INSIGHTS_USER_AGENT)

  const rawBody = await actionRequest.text()
  return JSON.parse(rawBody)['events'][0]
}

describe('AlgoliaInsights.productAddedEvents', () => {
  it('should submit productAddedEvents on track "Product Added" event', async () => {
    const event = createTestEvent({
      type: 'track',
      event: 'Product Added',
      properties: {
        query_id: '1234',
        search_index: 'fashion_1',
        product_id: '9876'
      }
    })
    const algoliaEvent = await testAlgoliaDestination(event)

    expect(algoliaEvent.eventName).toBe('Add to cart')
    expect(algoliaEvent.eventType).toBe('conversion')
    expect(algoliaEvent.index).toBe(event.properties?.search_index)
    expect(algoliaEvent.userToken).toBe(event.userId)
    expect(algoliaEvent.objectIDs).toContain('9876')
  })

  it('should pass timestamp if present', async () => {
    const event = createTestEvent({
      type: 'track',
      event: 'Product Added',
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
      event: 'Product Added',
      properties: {
        query_id: '1234',
        search_index: 'fashion_1',
        product_id: '9876'
      }
    })
    const algoliaEvent = await testAlgoliaDestination(event)
    expect(algoliaEvent.queryID).toBe(event.properties?.query_id)
  })
})
