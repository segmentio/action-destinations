import nock from 'nock'

import Destination from '../../index'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'

const testDestination = createTestIntegration(Destination)
const timestamp = '2021-08-17T15:21:15.449Z'
const useDefaultMappings = true

describe('Insider.productListViewedEvent', () => {
  it('should insert listing page view event', async () => {
    nock('https://unification.useinsider.com/api').post('/user/v1/upsert').reply(200, {})

    const event = createTestEvent({
      timestamp,
      event: 'listing_page_view',
      anonymousId: 'test'
    })

    const responses = await testDestination.testAction('productListViewedEvent', { event, useDefaultMappings })
    expect(responses[0].status).toBe(200)
  }),
    it('should insert confirmation page view events in batch', async () => {
      nock('https://unification.useinsider.com/api').post('/user/v1/upsert').reply(200, { success: 2 })

      const events = [
        createTestEvent({
          timestamp,
          event: 'listing_page_view',
          anonymousId: 'test'
        }),
        createTestEvent({
          timestamp,
          event: 'listing_page_view',
          anonymousId: 'test2'
        })
      ]

      const request = await testDestination.testBatchAction('productListViewedEvent', { events, useDefaultMappings })

      expect(request[0].status).toBe(200)
    })
})
