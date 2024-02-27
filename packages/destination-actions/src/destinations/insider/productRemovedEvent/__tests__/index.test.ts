import nock from 'nock'

import Destination from '../../index'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'

const testDestination = createTestIntegration(Destination)
const timestamp = '2021-08-17T15:21:15.449Z'
const useDefaultMappings = true

describe('Insider.productRemovedEvent', () => {
  it('should insert product remove event', async () => {
    nock('https://unification.useinsider.com/api').post('/user/v1/upsert').reply(200, {})

    const event = createTestEvent({
      timestamp,
      event: 'item_removed_from_cart',
      anonymousId: 'test'
    })

    const responses = await testDestination.testAction('productRemovedEvent', { event, useDefaultMappings })
    expect(responses[0].status).toBe(200)
  }),
    it('should insert product remove events in batch', async () => {
      nock('https://unification.useinsider.com/api').post('/user/v1/upsert').reply(200, { success: 2 })

      const events = [
        createTestEvent({
          timestamp,
          event: 'item_removed_from_cart',
          anonymousId: 'test'
        }),
        createTestEvent({
          timestamp,
          event: 'item_removed_from_cart',
          anonymousId: 'test2'
        })
      ]

      const request = await testDestination.testBatchAction('productRemovedEvent', { events, useDefaultMappings })

      expect(request[0].status).toBe(200)
    })
})
