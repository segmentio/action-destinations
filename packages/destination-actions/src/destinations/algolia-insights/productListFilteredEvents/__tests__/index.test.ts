import nock from 'nock'
import { SegmentEvent, createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination, { ALGOLIA_INSIGHTS_USER_AGENT } from '../../index'
import { AlgoliaFilterClickedEvent, BaseAlgoliaInsightsURL } from '../../algolia-insight-api'

const testDestination = createTestIntegration(Destination)

const algoliaDestinationActionSettings = {
  appId: 'algolia-application-id',
  apiKey: 'algolia-api-key'
}

const testAlgoliaDestination = async (event: SegmentEvent): Promise<AlgoliaFilterClickedEvent> => {
  nock(BaseAlgoliaInsightsURL).post('/1/events').reply(200, {})
  const segmentEvent = {
    event: { ...event },
    settings: algoliaDestinationActionSettings,
    useDefaultMappings: true
  }
  const actionResponse = await testDestination.testAction('productListFilteredEvents', segmentEvent)
  const actionRequest = actionResponse[0].request

  expect(actionResponse.length).toBe(1)
  expect(actionRequest.headers.get('X-Algolia-Application-Id')).toBe(algoliaDestinationActionSettings.appId)
  expect(actionRequest.headers.get('X-Algolia-API-Key')).toBe(algoliaDestinationActionSettings.apiKey)
  expect(actionRequest.headers.get('X-Algolia-Agent')).toBe(ALGOLIA_INSIGHTS_USER_AGENT)

  const rawBody = await actionRequest.text()
  return JSON.parse(rawBody)['events'][0]
}

describe('AlgoliaInsights.productListFilteredEvents', () => {
  it('should submit click on track "Product List Filtered" event', async () => {
    const event = createTestEvent({
      type: 'track',
      event: 'Product List Filtered',
      properties: {
        search_index: 'fashion_1',
        filters: [{ attribute: 'discount', value: '10%25' }],
        position: 5
      }
    })
    const algoliaEvent = await testAlgoliaDestination(event)

    expect(algoliaEvent.eventName).toBe('Product List Filtered')
    expect(algoliaEvent.eventType).toBe('click')
    expect(algoliaEvent.index).toBe(event.properties?.search_index)
    expect(algoliaEvent.userToken).toBe(event.userId)
    expect(algoliaEvent.queryID).toBe(event.properties?.query_id)
    expect(algoliaEvent.filters).toContain('discount:10%25')
  })

  it('should pass timestamp if present', async () => {
    const event = createTestEvent({
      type: 'track',
      event: 'Product List Filtered',
      properties: {
        search_index: 'fashion_1',
        filters: [{ attribute: 'discount', value: '10%25' }]
      }
    })
    const algoliaEvent = await testAlgoliaDestination(event)
    expect(algoliaEvent.timestamp).toBe(new Date(event.timestamp as string).valueOf())
  })

  it('should pass position if present', async () => {
    const event = createTestEvent({
      type: 'track',
      event: 'Product List Filtered',
      properties: {
        query_id: '1234',
        search_index: 'fashion_1',
        filters: [{ attribute: 'discount', value: '10%25' }]
      }
    })
    const algoliaEvent = await testAlgoliaDestination(event)
    expect(algoliaEvent.queryID).toBe(event.properties?.query_id)
  })
})
