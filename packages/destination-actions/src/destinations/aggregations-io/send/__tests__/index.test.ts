import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
const testIngestId = 'abc123'
const testApiKey = 'super-secret-key'
const ingestUrl = 'https://ingest.aggregations.io'
describe('AggregationsIo.send', () => {
  const event1 = createTestEvent()
  const event2 = createTestEvent()

  it('should work for single event', async () => {
    nock(ingestUrl).post(`/${testIngestId}`).reply(200).matchHeader('x-api-token', testApiKey)
    const response = await testDestination.testAction('send', {
      event: event1,
      settings: {
        api_key: testApiKey,
        ingest_id: testIngestId
      },
      useDefaultMappings: true
    })
    expect(response.length).toBe(1)
    expect(new URL(response[0].url).pathname).toBe('/' + testIngestId)
    expect(response[0].status).toBe(200)
  })

  it('should work for batched events', async () => {
    nock(ingestUrl).post(`/${testIngestId}`).reply(200).matchHeader('x-api-token', testApiKey)
    const response = await testDestination.testBatchAction('send', {
      events: [event1, event2],
      settings: {
        api_key: testApiKey,
        ingest_id: testIngestId
      },
      useDefaultMappings: true
    })
    expect(response.length).toBe(1)
    expect(new URL(response[0].url).pathname).toBe('/' + testIngestId)
    expect(response[0].status).toBe(200)
  })
})
