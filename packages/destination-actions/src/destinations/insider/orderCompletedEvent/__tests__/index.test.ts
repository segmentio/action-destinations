import nock from 'nock'

import Destination from '../../index'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'

const testDestination = createTestIntegration(Destination)
const timestamp = '2021-08-17T15:21:15.449Z'
const useDefaultMappings = true

describe('Insider.orderCompletedEvent', () => {
  it('should insert event for confirmation page view', async () => {
    nock('https://unification.useinsider.com/api').post('/user/v1/upsert').reply(200, {})

    const event = createTestEvent({
      timestamp,
      event: 'confirmation_page_view',
      anonymousId: 'test'
    })

    const responses = await testDestination.testAction('orderCompletedEvent', { event, useDefaultMappings })
    expect(responses[0].status).toBe(200)
  }),
    it('should insert confirmation page view events in batch', async () => {
      nock('https://unification.useinsider.com/api').post('/user/v1/upsert').reply(200, { success: 2 })

      const events = [
        createTestEvent({
          timestamp,
          event: 'confirmation_page_view',
          anonymousId: 'test'
        }),
        createTestEvent({
          timestamp,
          event: 'confirmation_page_view',
          anonymousId: 'test2'
        })
      ]

      const request = await testDestination.testBatchAction('orderCompletedEvent', { events, useDefaultMappings })

      expect(request[0].status).toBe(200)
    })
})
