import nock from 'nock'
import { createTestEvent, createTestIntegration, SegmentEvent } from '@segment/actions-core'
import Destination, { ALGOLIA_INSIGHTS_USER_AGENT } from '../../index'
import { AlgoliaProductViewedEvent, BaseAlgoliaInsightsURL } from '../../algolia-insight-api'

const testDestination = createTestIntegration(Destination)

const algoliaDestinationActionSettings = {
  appId: 'algolia-application-id',
  apiKey: 'algolia-api-key'
}
const testAlgoliaDestination = async (event: SegmentEvent): Promise<AlgoliaProductViewedEvent> => {
  nock(BaseAlgoliaInsightsURL).post('/1/events').reply(200, {})
  const segmentEvent = {
    event: { ...event },
    settings: algoliaDestinationActionSettings,
    useDefaultMappings: true
  }
  const actionResponse = await testDestination.testAction('productViewedEvents', segmentEvent)
  const actionRequest = actionResponse[0].request

  expect(actionResponse.length).toBe(1)
  expect(actionRequest.headers.get('X-Algolia-Application-Id')).toBe(algoliaDestinationActionSettings.appId)
  expect(actionRequest.headers.get('X-Algolia-API-Key')).toBe(algoliaDestinationActionSettings.apiKey)
  expect(actionRequest.headers.get('X-Algolia-Agent')).toBe(ALGOLIA_INSIGHTS_USER_AGENT)

  const rawBody = await actionRequest.text()
  return JSON.parse(rawBody)['events'][0]
}

describe('AlgoliaInsights.productViewedEvents', () => {
  it('should submit click on track "Product Viewed" event', async () => {
    const event = createTestEvent({
      type: 'track',
      event: 'Product Viewed',
      properties: {
        query_id: '1234',
        search_index: 'fashion_1',
        product_id: '9876'
      }
    })
    const algoliaEvent = await testAlgoliaDestination(event)

    expect(algoliaEvent.eventName).toBe('Product Viewed')
    expect(algoliaEvent.eventType).toBe('view')
    expect(algoliaEvent.index).toBe(event.properties?.search_index)
    expect(algoliaEvent.userToken).toBe(event.userId)
    expect(algoliaEvent.objectIDs).toContain('9876')
  })

  it('should pass timestamp if present', async () => {
    const event = createTestEvent({
      type: 'track',
      event: 'Product Viewed',
      properties: {
        query_id: '1234',
        search_index: 'fashion_1',
        product_id: '9876'
      },
      userId: undefined
    })
    const algoliaEvent = await testAlgoliaDestination(event)
    expect(algoliaEvent.timestamp).toBe(new Date(event.timestamp as string).valueOf())
  })
})
