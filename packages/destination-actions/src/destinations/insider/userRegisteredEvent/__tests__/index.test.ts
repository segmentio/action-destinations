import nock from 'nock'

import Destination from '../../index'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'

const testDestination = createTestIntegration(Destination)
const timestamp = '2021-08-17T15:21:15.449Z'
const useDefaultMappings = true

describe('Insider.userRegisteredEvent', () => {
  it('should update register user with default mapping', async () => {
    nock('https://unification.useinsider.com/api').post('/user/v1/upsert').reply(200, {})

    const event = createTestEvent({
      timestamp,
      event: 'sign_up_confirmation',
      anonymousId: 'test'
    })

    const responses = await testDestination.testAction('userRegisteredEvent', { event, useDefaultMappings })
    expect(responses[0].status).toBe(200)
  }),
    it('should update register user with default mapping in batch', async () => {
      nock('https://unification.useinsider.com/api').post('/user/v1/upsert').reply(200, {})

      const events = [
        createTestEvent({
          timestamp,
          event: 'sign_up_confirmation',
          anonymousId: 'test'
        }),
        createTestEvent({
          timestamp,
          event: 'sign_up_confirmation',
          anonymousId: 'test2'
        })
      ]

      const responses = await testDestination.testBatchAction('userRegisteredEvent', { events, useDefaultMappings })
      expect(responses[0].status).toBe(200)
    })
})
